import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { BulkPriceDto } from './dto/bulk-price.dto';
import { Material } from './entities/material.entity';

// Semua hitungan memakai sen (bilangan bulat) supaya tidak ada selisih desimal
const toCents = (v: string | number) => Math.round(Number(v) * 100);
const rupiah = (cents: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(cents / 100);

@Injectable()
export class MaterialsBulkService {
  constructor(
    @InjectRepository(Material) private readonly repo: Repository<Material>,
  ) {}

  async run(dto: BulkPriceDto) {
    const category = dto.category?.trim();
    const brand = dto.brand?.trim();
    const search = dto.search?.trim();

    if (!category && !brand && !search && !dto.all) {
      throw new BadRequestException(
        'Pilih minimal satu filter (kategori, merk, atau kata kunci), atau centang "semua material"',
      );
    }
    if (dto.value === 0) {
      throw new BadRequestException('Nilai perubahan tidak boleh 0');
    }
    if (dto.mode === 'percent' && (dto.value < -50 || dto.value > 100)) {
      throw new BadRequestException('Persen harus antara -50 dan 100');
    }
    if (dto.mode === 'amount' && Math.abs(dto.value) > 10_000_000) {
      throw new BadRequestException('Nominal terlalu besar (maksimal Rp 10.000.000)');
    }

    const rows = await this.repo.find({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(search ? { name: ILike(`%${search}%`) } : {}),
      },
      order: { category: 'ASC', name: 'ASC' },
    });

    const step = dto.rounding * 100; // pembulatan dalam sen
    const calc = (oldCents: number) => {
      let n =
        dto.mode === 'percent'
          ? Math.round(oldCents * (1 + dto.value / 100))
          : oldCents + Math.round(dto.value * 100);
      if (step > 0) n = Math.round(n / step) * step;
      return n;
    };

    const changed: {
      id: string;
      name: string;
      brand: string | null;
      unit: string;
      oldCents: number;
      newCents: number;
    }[] = [];
    let skippedNoPrice = 0;

    for (const m of rows) {
      const oldCents = toCents(m.price);

      // Harga Rp 0 artinya belum diisi, jadi tidak disentuh
      if (oldCents === 0) {
        skippedNoPrice++;
        continue;
      }

      const newCents = calc(oldCents);
      if (newCents <= 0) {
        throw new BadRequestException(
          `Harga ${m.name} akan menjadi ${rupiah(newCents)}. Perubahan dibatalkan.`,
        );
      }
      if (newCents !== oldCents) {
        changed.push({
          id: m.id,
          name: m.name,
          brand: m.brand,
          unit: m.unit,
          oldCents,
          newCents,
        });
      }
    }

    // Simpan semuanya dalam satu transaksi (atau tidak sama sekali)
    if (dto.apply && changed.length > 0) {
      await this.repo.manager.transaction(async (manager) => {
        for (const c of changed) {
          await manager.update(Material, c.id, {
            price: (c.newCents / 100).toFixed(2),
          });
        }
      });
    }

    return {
      applied: !!dto.apply,
      matched: rows.length,
      changed: changed.length,
      unchanged: rows.length - changed.length - skippedNoPrice,
      skippedNoPrice,
      items: changed.slice(0, 200).map((c) => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        unit: c.unit,
        oldPrice: c.oldCents / 100,
        newPrice: c.newCents / 100,
        diff: (c.newCents - c.oldCents) / 100,
      })),
    };
  }
}