import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Satu baris = satu jenis material (profil, kaca, aksesoris, dll)
@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string; // contoh: "Profil kusen 4 inci"

  @Column({ type: 'varchar', length: 50 })
  category: string; // profil, kaca, aksesoris, upah, dll

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null; // merk aluminium

  @Column({ type: 'varchar', length: 20 })
  unit: string; // batang, meter, lembar, pcs

  // Uang disimpan sebagai numeric, BUKAN float, supaya tidak ada selisih desimal
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  price: string; // harga per satuan

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  lengthPerUnit: string | null; // panjang 1 batang dalam meter (mis. 6)

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}