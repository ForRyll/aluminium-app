import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';

const PAGE_SIZE = 15;

// Semua hitungan uang memakai sen (bilangan bulat)
const toCents = (v: string | number) => Math.round(Number(v) * 100);

// Hanya order yang sudah deal yang punya tagihan
const BILLABLE = ['deal', 'dikerjakan', 'selesai'];

// Tanda % dan _ yang diketik pengguna dianggap huruf biasa, bukan karakter pengganti
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class OrderListService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  async list(query: OrderListQueryDto) {
    const q = query.q?.trim();
    const base: FindOptionsWhere<Order> = query.status
      ? { status: query.status }
      : {};

    // Kata kunci dicocokkan ke tiga kolom (salah satu cocok sudah cukup)
    const where: FindOptionsWhere<Order> | FindOptionsWhere<Order>[] = q
      ? [
          { ...base, orderNumber: ILike(`%${escapeLike(q)}%`) },
          { ...base, title: ILike(`%${escapeLike(q)}%`) },
          { ...base, customer: { name: ILike(`%${escapeLike(q)}%`) } },
        ]
      : base;

    const rows = await this.orders.find({
      where,
      relations: { customer: true },
      order: { createdAt: 'DESC' },
    });

    // Total pembayaran per order
    const paid = new Map<string, number>();
    if (rows.length > 0) {
      const pays = await this.payments.find({
        where: { order: { id: In(rows.map((r) => r.id)) } },
        relations: { order: true },
      });
      for (const p of pays) {
        paid.set(p.order.id, (paid.get(p.order.id) ?? 0) + toCents(p.amount));
      }
    }

    let items = rows.map((o) => {
      const priceCents = o.offeredPrice !== null ? toCents(o.offeredPrice) : null;
      const paidCents = paid.get(o.id) ?? 0;
      const billable = BILLABLE.includes(o.status) && priceCents !== null;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.title,
        customerName: o.customer?.name ?? '-',
        status: o.status,
        offeredPrice: priceCents !== null ? priceCents / 100 : null,
        dueDate: o.dueDate,
        paid: paidCents / 100,
        // null = belum ada tagihan (belum deal, atau harga belum diisi)
        remaining: billable ? (priceCents - paidCents) / 100 : null,
      };
    });

    if (query.unpaid === '1') {
      items = items.filter((i) => i.remaining !== null && i.remaining > 0);
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(query.page ?? 1, totalPages);
    const start = (page - 1) * PAGE_SIZE;

    return {
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      items: items.slice(start, start + PAGE_SIZE),
    };
  }
}