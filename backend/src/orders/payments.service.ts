import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';

// Pembayaran hanya boleh dicatat setelah order deal
const PAYABLE = ['deal', 'dikerjakan', 'selesai'];

const toCents = (v: string | number) => Math.round(Number(v) * 100);
const rupiah = (cents: number) =>
  'Rp ' + new Intl.NumberFormat('id-ID').format(cents / 100);

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  private async getOrder(orderId: string) {
    const order = await this.orders.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException('Order tidak ditemukan');
    return order;
  }

  // Daftar pembayaran beserta total terbayar dan sisa tagihan
  async list(orderId: string) {
    const order = await this.getOrder(orderId);
    const payments = await this.payments.find({
      where: { order: { id: orderId } },
      order: { paidAt: 'ASC', createdAt: 'ASC' },
    });

    const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
    const agreedCents =
      order.offeredPrice !== null ? toCents(order.offeredPrice) : null;

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      agreedPrice: agreedCents !== null ? agreedCents / 100 : null,
      totalPaid: paidCents / 100,
      remaining: agreedCents !== null ? (agreedCents - paidCents) / 100 : null,
      payments,
    };
  }

  async add(orderId: string, dto: CreatePaymentDto) {
    const order = await this.getOrder(orderId);

    if (!PAYABLE.includes(order.status)) {
      throw new BadRequestException(
        `Pembayaran baru bisa dicatat setelah order deal (status sekarang: ${order.status})`,
      );
    }
    if (order.offeredPrice === null) {
      throw new BadRequestException('Harga kesepakatan belum diisi');
    }

    // Total pembayaran tidak boleh melebihi harga kesepakatan
    const current = await this.list(orderId);
    const agreedCents = toCents(order.offeredPrice);
    const paidCents = toCents(current.totalPaid);
    const amountCents = toCents(dto.amount);

    if (paidCents + amountCents > agreedCents) {
      throw new BadRequestException(
        `Pembayaran melebihi sisa tagihan. Sisa tagihan: ${rupiah(agreedCents - paidCents)}`,
      );
    }

    const payment = this.payments.create({
      order,
      amount: dto.amount.toFixed(2),
      paidAt: dto.paidAt ?? new Date().toLocaleDateString('en-CA'),
      method: dto.method,
      note: dto.note ?? null,
    });
    await this.payments.save(payment);

    return this.list(orderId);
  }

  // Hapus satu pembayaran (untuk memperbaiki salah catat)
  async remove(orderId: string, paymentId: string) {
    const payment = await this.payments.findOne({
      where: { id: paymentId, order: { id: orderId } },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');

    await this.payments.remove(payment);
    return this.list(orderId);
  }
}