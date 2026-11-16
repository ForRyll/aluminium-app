import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// numeric di Postgres kembali sebagai string, ubah ke number
const num = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? null : Number(v)),
};

export type DataStatus = 'belum_diverifikasi' | 'terverifikasi';

// Harga profil per meter lari: per merk + seri (3 / 4 inci)
@Entity('calc_profile_prices')
export class ProfilePrice {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() brand: string;
  @Column() series: string; // '3' | '4'
  @Column('numeric', { transformer: num }) pricePerMeter: number;
  @Column({ default: 'belum_diverifikasi' }) status: DataStatus;
}

// Jenis profil (kusen, daun, rel, list kaca). Default ikut harga seri,
// kalau priceOverride diisi, itu yang dipakai (harga per jenis).
@Entity('calc_profile_types')
export class ProfileType {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string; // contoh: KUSEN_M_3
  @Column() name: string;
  @Column() series: string;
  @Column('numeric', { nullable: true, transformer: num }) priceOverride: number | null;
}

@Entity('calc_glass_types')
export class GlassType {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column('numeric', { transformer: num }) thicknessMm: number;
  @Column('numeric', { transformer: num }) pricePerM2: number;
  @Column({ default: 'belum_diverifikasi' }) status: DataStatus;
}

@Entity('calc_accessories')
export class Accessory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string; // contoh: ENGSEL_PINTU
  @Column() name: string;
  @Column() unit: string; // buah | set | m | tube
  @Column('numeric', { transformer: num }) price: number;
  @Column({ default: 'belum_diverifikasi' }) status: DataStatus;
}

@Entity('calc_products')
export class CalcProduct {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) code: string; // JENDELA_SWING, JENDELA_SLIDING, PINTU_SWING, KACA_MATI
  @Column() name: string;
  @Column({ default: 1 }) priority: number;
  @Column('numeric', { default: 0, transformer: num }) buildLabor: number;
  @Column('numeric', { default: 0, transformer: num }) installLabor: number;
  @Column('numeric', { default: 0, transformer: num }) minPrice: number;
  // rumus ukuran kaca per bidang; kosong = produk tanpa kaca
  @Column({ type: 'varchar', nullable: true }) glassWidthFormula: string | null;
  @Column({ type: 'varchar', nullable: true }) glassHeightFormula: string | null;
  @Column({ default: 'belum_diverifikasi' }) status: DataStatus;
}

// Potongan profil dalam resep. leaves = variabel S (jumlah daun)
@Entity('calc_recipe_components')
export class RecipeComponent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() productCode: string;
  @Column() name: string;
  @Column() profileTypeCode: string;
  @Column() lengthFormula: string; // contoh: "L - 8", "(L / 2) - 3"
  @Column({ default: '1' }) qtyFormula: string; // contoh: "1", "2", "S * 2"
  @Column({ default: 0 }) sortOrder: number;
}

// Aksesoris per produk, jumlahnya juga rumus
@Entity('calc_accessory_rules')
export class AccessoryRule {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() productCode: string;
  @Column() accessoryCode: string;
  @Column({ default: '1' }) qtyFormula: string; // contoh: "S * 2"
  @Column({ default: false }) optional: boolean;
}

@Entity('calc_finishings')
export class Finishing {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) name: string;
  @Column('numeric', { default: 0, transformer: num }) percent: number; // tambahan % ke biaya profil
}

// Biaya lain: flat per pekerjaan, per unit, atau persen dari modal produksi
@Entity('calc_overheads')
export class Overhead {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() kind: string; // 'flat' | 'per_unit' | 'percent'
  @Column('numeric', { transformer: num }) amount: number;
  @Column({ default: true }) enabled: boolean;
}

// Satu baris pengaturan umum (batang 6 m, waste, markup, minimal kaca)
@Entity('calc_settings')
export class CalcSetting {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) key: string;
  @Column('numeric', { transformer: num }) value: number;
}

export const CALC_ENTITIES = [
  ProfilePrice, ProfileType, GlassType, Accessory, CalcProduct,
  RecipeComponent, AccessoryRule, Finishing, Overhead, CalcSetting,
];