import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from '../../materials/entities/material.entity';
import { Order } from './order.entity';

// Satu baris = satu komponen dalam order (profil, kaca, aksesoris, dll)
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  // Boleh kosong, untuk item bebas yang tidak ada di katalog
  @ManyToOne(() => Material, { nullable: true, onDelete: 'SET NULL' })
  material: Material | null;

  @Column({ type: 'varchar', length: 200 })
  description: string; // disalin dari nama material, atau diisi bebas

  @Column({ type: 'varchar', length: 20 })
  unit: string;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity: string;

  // Snapshot harga saat order dibuat, tidak ikut berubah kalau katalog naik
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitPrice: string;
}