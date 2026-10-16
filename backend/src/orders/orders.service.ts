import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Material } from '../materials/entities/material.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Material)
    private readonly materials: Repository<Material>,
  ) {}

  // Nomor urut per tahun: ORD-2026-0001, ORD-2026-0002, dst
  private async nextOrderNumber() {
    const year = new Date().getFullYear();
    const count = await this.orders.count({
      where: { orderNumber: Like(`ORD-${year}-%`) },
    });
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateOrderDto) {
    const customer = await this.customers.findOneBy({ id: dto.customerId });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');

    const items = [];
    for (const i of dto.items) {
      let material: Material | null = null;
      if (i.materialId) {
        material = await this.materials.findOneBy({ id: i.materialId });
        if (!material) {
          throw new NotFoundException(
            `Material ${i.materialId} tidak ditemukan`,
          );
        }
      }

      // Nilai dari item menang, kalau kosong ambil dari katalog
      const description = i.description ?? material?.name;
      const unit = i.unit ?? material?.unit;
      const unitPrice =
        i.unitPrice !== undefined ? i.unitPrice.toFixed(2) : material?.price;

      if (!description || !unit || unitPrice === undefined) {
        throw new BadRequestException(
          'Item tanpa materialId harus punya description, unit, dan unitPrice',
        );
      }

      items.push({
        material,
        description,
        unit,
        quantity: i.quantity.toFixed(3),
        unitPrice, // snapshot harga saat order dibuat
      });
    }

    const order = this.orders.create({
      orderNumber: await this.nextOrderNumber(),
      customer,
      title: dto.title,
      items,
      laborCost: (dto.laborCost ?? 0).toFixed(2),
      deliveryCost: (dto.deliveryCost ?? 0).toFixed(2),
      otherCost: (dto.otherCost ?? 0).toFixed(2),
      offeredPrice:
        dto.offeredPrice !== undefined ? dto.offeredPrice.toFixed(2) : null,
      notes: dto.notes ?? null,
    });
    return this.orders.save(order);
  }

  findAll() {
    return this.orders.find({
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orders.findOne({
      where: { id },
      relations: { customer: true, items: { material: true } },
    });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }
    // Ringkasan keuangan order. price dan targetMargin opsional,
  // dipakai untuk simulasi tawar-menawar tanpa mengubah data order.
  async summary(id: string, price?: number, targetMargin = 15) {
    if (targetMargin < 0 || targetMargin >= 100) {
      throw new BadRequestException('targetMargin harus antara 0 dan 99');
    }

    const order = await this.findOne(id);
    const toCents = (v: string | number) => Math.round(Number(v) * 100);
    const rp = (cents: number) => cents / 100;

    // Total bahan = jumlah (quantity x harga satuan) semua item
    const materialCents = order.items.reduce(
      (sum, i) => sum + Math.round(Number(i.quantity) * toCents(i.unitPrice)),
      0,
    );
    const laborCents = toCents(order.laborCost);
    const deliveryCents = toCents(order.deliveryCost);
    const otherCents = toCents(order.otherCost);
    const costCents = materialCents + laborCents + deliveryCents + otherCents;

    // Harga yang dinilai: dari simulasi, kalau tidak ada pakai harga tawar order
    const priceCents =
      price !== undefined
        ? toCents(price)
        : order.offeredPrice !== null
          ? toCents(order.offeredPrice)
          : null;

    // Harga minimum agar margin mencapai target, dibulatkan ke atas per Rp1.000
    const targetCents = Math.ceil(
      Math.ceil(costCents / (1 - targetMargin / 100) / 100000) * 100000,
    );

    let evaluation: Record<string, unknown> | null = null;
    if (priceCents !== null) {
      const profitCents = priceCents - costCents;
      const margin = priceCents > 0 ? (profitCents / priceCents) * 100 : 0;
      evaluation = {
        price: rp(priceCents),
        profit: rp(profitCents),
        marginPercent: Number(margin.toFixed(2)),
        status:
          profitCents < 0
            ? 'rugi'
            : margin < targetMargin
              ? 'tipis'
              : 'aman',
      };
    }

    return {
      orderNumber: order.orderNumber,
      cost: {
        material: rp(materialCents),
        labor: rp(laborCents),
        delivery: rp(deliveryCents),
        other: rp(otherCents),
        total: rp(costCents), // modal
      },
      breakEvenPrice: rp(costCents), // di bawah ini pasti rugi
      targetMarginPercent: targetMargin,
      recommendedMinPrice: rp(targetCents), // harga minimum untuk capai target
      evaluation,
    };
  }
}