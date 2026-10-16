import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { Material } from './entities/material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly repo: Repository<Material>,
  ) {}

  // Ubah angka dari DTO jadi teks 2 desimal untuk kolom numeric
  private toEntityData(dto: CreateMaterialDto | UpdateMaterialDto) {
    const { price, lengthPerUnit, ...rest } = dto;
    return {
      ...rest,
      ...(price !== undefined && { price: price.toFixed(2) }),
      ...(lengthPerUnit !== undefined && {
        lengthPerUnit: lengthPerUnit.toFixed(2),
      }),
    };
  }

  create(dto: CreateMaterialDto) {
    const material = this.repo.create(this.toEntityData(dto));
    return this.repo.save(material);
  }

  // Filter: pencarian nama, kategori, dan tampilkan yang nonaktif atau tidak
  findAll(search?: string, category?: string, includeInactive = false) {
    return this.repo.find({
      where: {
        ...(search && { name: ILike(`%${search}%`) }),
        ...(category && { category }),
        ...(!includeInactive && { isActive: true }),
      },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const material = await this.repo.findOneBy({ id });
    if (!material) throw new NotFoundException('Material tidak ditemukan');
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);
    Object.assign(material, this.toEntityData(dto));
    return this.repo.save(material);
  }

  // "Hapus" = nonaktifkan, supaya riwayat order lama tetap utuh
  async remove(id: string) {
    const material = await this.findOne(id);
    material.isActive = false;
    return this.repo.save(material);
  }
}