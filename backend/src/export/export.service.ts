import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Material } from '../materials/entities/material.entity';
import { OrderPhoto } from '../orders/entities/order-photo.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../orders/entities/payment.entity';

const toCents = (v: string | number) => Math.round(Number(v) * 100);

// Angka untuk Excel Indonesia: titik desimal diganti koma
const num = (cents: number) => String(cents / 100).replace('.', ',');

// Tanggal lokal (YYYY-MM-DD)
const day = (d: Date | string) => new Date(d).toLocaleDateString('en-CA');

type Cell = string | number | null | undefined;

// Susun CSV: pemisah titik koma, UTF-8 dengan BOM, dan teks aman dari rumus Excel
function csv(header: string[], rows: Cell[][]): Buffer {
  const cell = (v: Cell) => {
    const s = v === null || v === undefined ? '' : String(v);
    const isNumber = !isNaN(Number(s.replace(',', '.'))) && s.trim() !== '';
    const safe = /^[=+\-@]/.test(s) && !isNumber ? "'" + s : s;
    return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [header, ...rows].map((r) => r.map(cell).join(';'));
  return Buffer.from('\uFEFF' + lines.join('\r\n') + '\r\n', 'utf8');
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Material) private readonly materials: Repository<Material>,
    @InjectRepository(OrderPhoto) private readonly photos: Repository<OrderPhoto>,
  ) {}

  // Modal total satu order, dalam sen
  private costCents(o: Order) {
    const material = o.items.reduce(
      (sum, i) => sum + Math.round(Number(i.quantity) * toCents(i.unitPrice)),
      0,
    );
    return {
      material,
      total:
        material +
        toCents(o.laborCost) +
        toCents(o.deliveryCost) +
        toCents(o.otherCost),
    };
  }

  async build(name: string) {
    const today = day(new Date());
    switch (name) {
      case 'orders.csv':
        return { fileName: `order-${today}.csv`, type: 'text/csv; charset=utf-8', data: await this.ordersCsv() };
      case 'payments.csv':
        return { fileName: `pembayaran-${today}.csv`, type: 'text/csv; charset=utf-8', data: await this.paymentsCsv() };
      case 'customers.csv':
        return { fileName: `pelanggan-${today}.csv`, type: 'text/csv; charset=utf-8', data: await this.customersCsv() };
      case 'materials.csv':
        return { fileName: `material-${today}.csv`, type: 'text/csv; charset=utf-8', data: await this.materialsCsv() };
      case 'backup.json':
        return { fileName: `backup-aluminium-${today}.json`, type: 'application/json; charset=utf-8', data: await this.backupJson() };
      default:
        throw new NotFoundException('File ekspor tidak dikenal');
    }
  }

  private async ordersCsv() {
    const [orders, payments] = await Promise.all([
      this.orders.find({
        relations: { customer: true, items: true },
        order: { createdAt: 'ASC' },
      }),
      this.payments.find({ relations: { order: true } }),
    ]);

    const paid = new Map<string, number>();
    for (const p of payments) {
      paid.set(p.order.id, (paid.get(p.order.id) ?? 0) + toCents(p.amount));
    }

    const rows = orders.map((o) => {
      const cost = this.costCents(o);
      const price = o.offeredPrice !== null ? toCents(o.offeredPrice) : null;
      const profit = price !== null ? price - cost.total : null;
      const margin =
        price !== null && price > 0 && profit !== null
          ? String(Number(((profit / price) * 100).toFixed(2))).replace('.', ',')
          : '';
      const paidCents = paid.get(o.id) ?? 0;
      return [
        o.orderNumber,
        day(o.createdAt),
        o.title,
        o.customer?.name ?? '',
        o.status,
        num(cost.material),
        num(toCents(o.laborCost)),
        num(toCents(o.deliveryCost)),
        num(toCents(o.otherCost)),
        num(cost.total),
        price !== null ? num(price) : '',
        profit !== null ? num(profit) : '',
        margin,
        num(paidCents),
        price !== null ? num(price - paidCents) : '',
      ];
    });

    return csv(
      [
        'No. Order', 'Tanggal', 'Pekerjaan', 'Pelanggan', 'Status',
        'Bahan', 'Upah', 'Ongkir', 'Biaya lain', 'Total modal',
        'Harga kesepakatan', 'Untung', 'Margin (%)', 'Sudah dibayar', 'Sisa tagihan',
      ],
      rows,
    );
  }

  private async paymentsCsv() {
    const rows = await this.payments.find({
      relations: { order: { customer: true } },
      order: { paidAt: 'ASC', createdAt: 'ASC' },
    });
    return csv(
      ['Tanggal', 'No. Order', 'Pelanggan', 'Jumlah', 'Cara bayar', 'Keterangan'],
      rows.map((p) => [
        String(p.paidAt).slice(0, 10),
        p.order.orderNumber,
        p.order.customer?.name ?? '',
        num(toCents(p.amount)),
        p.method,
        p.note,
      ]),
    );
  }

  private async customersCsv() {
    const [customers, orders] = await Promise.all([
      this.customers.find({ order: { name: 'ASC' } }),
      this.orders.find({ relations: { customer: true } }),
    ]);
    const count = new Map<string, number>();
    for (const o of orders) {
      const id = o.customer?.id;
      if (id) count.set(id, (count.get(id) ?? 0) + 1);
    }
    return csv(
      ['Nama', 'No. HP', 'Alamat', 'Catatan', 'Jumlah order'],
      customers.map((c) => [c.name, c.phone, c.address, c.notes, count.get(c.id) ?? 0]),
    );
  }

  private async materialsCsv() {
    const rows = await this.materials.find({ order: { category: 'ASC', name: 'ASC' } });
    return csv(
      ['Nama', 'Kategori', 'Merk', 'Satuan', 'Harga', 'Panjang per satuan (m)', 'Aktif'],
      rows.map((m) => [
        m.name,
        m.category,
        m.brand,
        m.unit,
        num(toCents(m.price)),
        m.lengthPerUnit !== null ? String(Number(m.lengthPerUnit)).replace('.', ',') : '',
        m.isActive ? 'ya' : 'tidak',
      ]),
    );
  }

  // Backup lengkap. Akun admin tidak ikut, supaya kata sandinya tidak tertulis di file.
  private async backupJson() {
    const [customers, materials, orders, payments, photos] = await Promise.all([
      this.customers.find({ order: { createdAt: 'ASC' } }),
      this.materials.find({ order: { createdAt: 'ASC' } }),
      this.orders.find({
        relations: { customer: true, items: { material: true } },
        order: { createdAt: 'ASC' },
      }),
      this.payments.find({ relations: { order: true }, order: { createdAt: 'ASC' } }),
      this.photos.find({ relations: { order: true }, order: { createdAt: 'ASC' } }),
    ]);

    const data = {
      app: 'aluminium-app',
      version: 1,
      exportedAt: new Date().toISOString(),
      counts: {
        customers: customers.length,
        materials: materials.length,
        orders: orders.length,
        payments: payments.length,
        photos: photos.length,
      },
      customers,
      materials,
      orders: orders.map(({ customer, items, ...o }) => ({
        ...o,
        customerId: customer?.id ?? null,
        items: items.map(({ material, ...i }) => ({ ...i, materialId: material?.id ?? null })),
      })),
      payments: payments.map(({ order, ...p }) => ({ ...p, orderId: order.id })),
      // Hanya keterangan foto. Berkas fotonya ada di folder uploads.
      photos: photos.map(({ order, ...p }) => ({ ...p, orderId: order.id })),
    };
    return Buffer.from(JSON.stringify(data, null, 2), 'utf8');
  }
}