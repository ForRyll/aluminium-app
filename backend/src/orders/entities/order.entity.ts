import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';

// Alur status order, dari awal sampai selesai
export type OrderStatus =
  | 'draft'
  | 'penawaran'
  | 'deal'
  | 'dikerjakan'
  | 'selesai'
  | 'batal';

// Satu baris = satu order / proyek (mis. "Kusen dan jendela rumah Pak Budi")
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  orderNumber: string; // contoh: ORD-2026-0001

  // RESTRICT: pelanggan yang sudah punya order tidak bisa dihapus
  @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
  customer: Customer;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  // Biaya di luar bahan, semuanya masuk perhitungan modal
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  laborCost: string; // upah tukang

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  deliveryCost: string; // ongkir / transport

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  otherCost: string; // biaya lain

  // Harga yang ditawarkan atau disepakati dengan pelanggan
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  offeredPrice: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Jadwal pengerjaan (format YYYY-MM-DD)
  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}