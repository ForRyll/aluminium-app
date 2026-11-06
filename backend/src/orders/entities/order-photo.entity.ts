import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export type PhotoKind = 'sebelum' | 'proses' | 'sesudah';

// Satu baris = satu foto order. Fotonya sendiri disimpan sebagai file, bukan di database.
@Entity('order_photos')
export class OrderPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
  order: Order;

  // Nama file di disk (acak), bukan nama asli dari pengguna
  @Column({ type: 'varchar', length: 80 })
  fileName: string;

  @Column({ type: 'varchar', length: 200 })
  originalName: string;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'integer' })
  size: number;

  // Tahap pengerjaan saat foto diambil
  @Column({ type: 'varchar', length: 20, default: 'proses' })
  kind: PhotoKind;

  @Column({ type: 'varchar', length: 200, nullable: true })
  caption: string | null;

  @CreateDateColumn()
  createdAt: Date;
}