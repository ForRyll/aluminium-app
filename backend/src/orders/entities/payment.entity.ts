import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

// Satu baris = satu kali pembayaran (DP, cicilan, atau pelunasan)
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RESTRICT: order yang sudah punya pembayaran tidak bisa terhapus diam-diam
  @ManyToOne(() => Order, { nullable: false, onDelete: 'RESTRICT' })
  order: Order;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  // Tanggal uang diterima, format YYYY-MM-DD
  @Column({ type: 'date' })
  paidAt: string;

  @Column({ type: 'varchar', length: 20, default: 'tunai' })
  method: string; // tunai, transfer, lainnya

  @Column({ type: 'varchar', length: 200, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}