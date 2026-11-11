import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { SetScheduleDto } from './dto/set-schedule.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  // Tanggal hari ini menurut jam server (YYYY-MM-DD)
  private today() {
    return new Date().toLocaleDateString('en-CA');
  }

  // Tolak tanggal yang tidak ada di kalender, seperti 2026-02-31
  private isRealDate(s: string) {
    const d = new Date(`${s}T00:00:00`);
    return !isNaN(d.getTime()) && d.toLocaleDateString('en-CA') === s;
  }

  async set(orderId: string, dto: SetScheduleDto) {
    const order = await this.orders.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order tidak ditemukan');

    if (['selesai', 'batal'].includes(order.status)) {
      throw new BadRequestException(
        `Order berstatus ${order.status} tidak bisa dijadwalkan ulang`,
      );
    }

    for (const v of [dto.startDate, dto.dueDate]) {
      if (typeof v === 'string' && !this.isRealDate(v)) {
        throw new BadRequestException(`Tanggal ${v} tidak valid`);
      }
    }

    // Kolom yang tidak dikirim tetap memakai nilai lama
    const start = dto.startDate !== undefined ? dto.startDate : order.startDate;
    const due = dto.dueDate !== undefined ? dto.dueDate : order.dueDate;

    if (start && due && due < start) {
      throw new BadRequestException(
        'Tanggal jatuh tempo tidak boleh sebelum tanggal mulai',
      );
    }

    await this.orders.update(orderId, { startDate: start, dueDate: due });
    return { orderNumber: order.orderNumber, startDate: start, dueDate: due };
  }

  // Pekerjaan yang sedang dijanjikan (deal dan dikerjakan), urut dari jatuh tempo terdekat
  async upcoming() {
    const rows = await this.orders.find({
      where: { status: In(['deal', 'dikerjakan']), dueDate: Not(IsNull()) },
      relations: { customer: true },
      order: { dueDate: 'ASC' },
    });

    const t0 = Date.parse(`${this.today()}T00:00:00`);
    const items = rows.map((o) => {
      const daysLeft = Math.round(
        (Date.parse(`${o.dueDate}T00:00:00`) - t0) / 86_400_000,
      );
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        title: o.title,
        customerName: o.customer?.name ?? '-',
        status: o.status,
        startDate: o.startDate,
        dueDate: o.dueDate,
        daysLeft, // negatif = sudah lewat
        overdue: daysLeft < 0,
      };
    });

    return {
      overdueCount: items.filter((i) => i.overdue).length,
      soonCount: items.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 7).length,
      items: items.slice(0, 10),
    };
  }
}