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
import { OrderItemDto } from './dto/order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Material)
    private readonly materials: Repository<Material>,
  ) {}

  // Alur yang diperbolehkan: dari status apa ke status apa
  private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    draft: ['penawaran', 'batal'],
    penawaran: ['draft', 'deal', 'batal'],
    deal: ['dikerjakan', 'batal'],
    dikerjakan: ['selesai', 'batal'],
    selesai: [],
    batal: [],
  };

  // Order hanya boleh diedit selama belum deal
  private readonly editableStatuses: OrderStatus[] = ['draft', 'penawaran'];

  // Nomor urut per tahun: ORD-2026-0001, ORD-2026-0002, dst
  private async nextOrderNumber() {
    const year = new Date().getFullYear();
    const count = await this.orders.count({
      where: { orderNumber: Like(`ORD-${year}-%`) },
    });
    return `ORD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Ubah daftar item dari layar menjadi data siap simpan.
  // Item katalog: harga disalin dari katalog (snapshot). Item bebas: diisi manual.
  private async buildItems(dtoItems: OrderItemDto[]) {
    const items: {
      material: Material | null;
      description: string;
      unit: string;
      quantity: string;
      unitPrice: string;
    }[] = [];

    for (const i of dtoItems) {
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
        unitPrice,
      });
    }
    return items;
  }

  async create(dto: CreateOrderDto) {
    const customer = await this.customers.findOneBy({ id: dto.customerId });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');

    const order = this.orders.create({
      orderNumber: await this.nextOrderNumber(),
      customer,
      title: dto.title,
      items: await this.buildItems(dto.items),
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

  // Edit order. Hanya saat draft atau penawaran.
  // Kalau items dikirim, seluruh daftar item diganti dalam satu transaksi.
  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.findOne(id);

    if (!this.editableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order berstatus ${order.status} tidak bisa diedit. ` +
          `Hanya order draft atau penawaran yang boleh diedit`,
      );
    }

    // Siapkan item baru lebih dulu, supaya input yang salah ditolak sebelum ada yang diubah
    const newItems = dto.items ? await this.buildItems(dto.items) : null;

    await this.orders.manager.transaction(async (manager) => {
      const patch: Partial<
        Pick<
          Order,
          | 'title'
          | 'laborCost'
          | 'deliveryCost'
          | 'otherCost'
          | 'offeredPrice'
          | 'notes'
        >
      > = {};

      if (dto.title !== undefined) patch.title = dto.title;
      if (dto.laborCost !== undefined) patch.laborCost = dto.laborCost.toFixed(2);
      if (dto.deliveryCost !== undefined) {
        patch.deliveryCost = dto.deliveryCost.toFixed(2);
      }
      if (dto.otherCost !== undefined) patch.otherCost = dto.otherCost.toFixed(2);
      if (dto.offeredPrice !== undefined) {
        patch.offeredPrice = dto.offeredPrice.toFixed(2);
      }
      if (dto.notes !== undefined) patch.notes = dto.notes;

      if (Object.keys(patch).length > 0) {
        await manager.update(Order, id, patch);
      }

      if (newItems) {
        // Hapus semua item lama, lalu buat item baru
        await manager.remove(OrderItem, order.items);
        const created = newItems.map((i) =>
          manager.create(OrderItem, { ...i, order: { id } }),
        );
        await manager.save(created);
      }
    });

    return this.findOne(id);
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const allowed = this.allowedTransitions[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Status ${order.status} tidak bisa langsung ke ${dto.status}. ` +
          `Yang boleh: ${allowed.join(', ') || 'tidak ada (status akhir)'}`,
      );
    }

    if (dto.finalPrice !== undefined) {
      order.offeredPrice = dto.finalPrice.toFixed(2);
    }
    if (dto.status === 'deal' && order.offeredPrice === null) {
      throw new BadRequestException(
        'Isi finalPrice (harga kesepakatan) sebelum status deal',
      );
    }

    order.status = dto.status;
    await this.orders.save(order);

    // Kembalikan status baru beserta evaluasi untung-rugi di harga terakhir
    const { evaluation } = await this.summary(id);
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      offeredPrice: order.offeredPrice,
      evaluation,
    };
  }
}