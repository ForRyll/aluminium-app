import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';

const toCents = (v: string | number) => Math.round(Number(v) * 100);
const rp = (cents: number) => cents / 100;

// Di bawah angka ini, margin dianggap tipis (sama dengan simulator di halaman order)
const TARGET_MARGIN = 15;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  // Modal total satu order, dalam sen: bahan + upah + ongkir + biaya lain
  private costCents(o: Order) {
    const material = o.items.reduce(
      (sum, i) => sum + Math.round(Number(i.quantity) * toCents(i.unitPrice)),
      0,
    );
    return (
      material +
      toCents(o.laborCost) +
      toCents(o.deliveryCost) +
      toCents(o.otherCost)
    );
  }

  async get() {
    const [orders, payments] = await Promise.all([
      this.orders.find({
        relations: { customer: true, items: true },
        order: { createdAt: 'DESC' },
      }),
      this.payments.find({ relations: { order: true } }),
    ]);

    // Total yang sudah dibayar per order (sen)
    const paidByOrder = new Map<string, number>();
    for (const p of payments) {
      paidByOrder.set(
        p.order.id,
        (paidByOrder.get(p.order.id) ?? 0) + toCents(p.amount),
      );
    }

    // Pemasukan 6 bulan terakhir (bulan ini di ujung)
    const today = new Date();
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(
        monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1)),
      );
    }
    const income = new Map<string, number>(months.map((m) => [m, 0]));
    for (const p of payments) {
      const key = String(p.paidAt).slice(0, 7);
      if (income.has(key)) income.set(key, income.get(key)! + toCents(p.amount));
    }
    const thisMonth = months[months.length - 1];

    // Margin tipis atau rugi: hanya untuk order yang masih bisa ditindaklanjuti
    const lowMargin: {
      id: string;
      orderNumber: string;
      title: string;
      customerName: string;
      status: string;
      price: number;
      profit: number;
      marginPercent: number;
      level: 'rugi' | 'tipis';
    }[] = [];

    // Sisa tagihan: order yang sudah deal tetapi belum lunas
    const unpaid: {
      id: string;
      orderNumber: string;
      title: string;
      customerName: string;
      status: string;
      agreedPrice: number;
      remaining: number;
    }[] = [];
    let outstandingCents = 0;

    for (const o of orders) {
      if (o.offeredPrice === null) continue;
      const priceCents = toCents(o.offeredPrice);

      if (['draft', 'penawaran', 'deal', 'dikerjakan'].includes(o.status)) {
        const profitCents = priceCents - this.costCents(o);
        const margin = priceCents > 0 ? (profitCents / priceCents) * 100 : 0;
        if (profitCents < 0 || margin < TARGET_MARGIN) {
          lowMargin.push({
            id: o.id,
            orderNumber: o.orderNumber,
            title: o.title,
            customerName: o.customer?.name ?? '-',
            status: o.status,
            price: rp(priceCents),
            profit: rp(profitCents),
            marginPercent: Number(margin.toFixed(2)),
            level: profitCents < 0 ? 'rugi' : 'tipis',
          });
        }
      }

      if (['deal', 'dikerjakan', 'selesai'].includes(o.status)) {
        const remaining = priceCents - (paidByOrder.get(o.id) ?? 0);
        if (remaining > 0) {
          outstandingCents += remaining;
          unpaid.push({
            id: o.id,
            orderNumber: o.orderNumber,
            title: o.title,
            customerName: o.customer?.name ?? '-',
            status: o.status,
            agreedPrice: rp(priceCents),
            remaining: rp(remaining),
          });
        }
      }
    }

    // Yang paling mengkhawatirkan di atas
    lowMargin.sort((a, b) => a.marginPercent - b.marginPercent);
    unpaid.sort((a, b) => b.remaining - a.remaining);

    const count = (statuses: string[]) =>
      orders.filter((o) => statuses.includes(o.status)).length;

    return {
      cards: {
        incomeThisMonth: rp(income.get(thisMonth) ?? 0),
        outstanding: rp(outstandingCents),
        activeOrders: count(['deal', 'dikerjakan']),
        pendingOrders: count(['draft', 'penawaran']),
      },
      thisMonth,
      incomeByMonth: months.map((m) => ({ month: m, total: rp(income.get(m) ?? 0) })),
      lowMargin: { count: lowMargin.length, items: lowMargin.slice(0, 5) },
      unpaid: { count: unpaid.length, items: unpaid.slice(0, 5) },
      recent: orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.title,
        customerName: o.customer?.name ?? '-',
        status: o.status,
        offeredPrice: o.offeredPrice !== null ? Number(o.offeredPrice) : null,
      })),
    };
  }
}