import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Accessory, AccessoryRule, CalcProduct, ProfileType, RecipeComponent,
} from './calculator.entities';
import { evalFormula } from './formula';

type Body = Record<string, unknown>;
const bad = (m: string) => new BadRequestException(m);

function only(b: Body, allowed: string[]) {
  for (const k of Object.keys(b)) if (!allowed.includes(k)) throw bad(`Kolom "${k}" tidak boleh diisi`);
}

function str(b: Body, k: string, opts: { max?: number; optional?: boolean } = {}): string | undefined {
  const v = b[k];
  if (v === undefined || v === null || v === '') {
    if (opts.optional) return undefined;
    throw bad(`${k} wajib diisi`);
  }
  if (typeof v !== 'string' || v.trim().length > (opts.max ?? 200)) throw bad(`${k} tidak valid`);
  return v.trim();
}

function num(b: Body, k: string, optional = false): number | undefined {
  const v = b[k];
  if (v === undefined || v === null || v === '') {
    if (optional) return undefined;
    throw bad(`${k} wajib diisi`);
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1e10) throw bad(`${k} harus angka 0 atau lebih`);
  return n;
}

// Rumus diuji dengan 1 dan 2 daun supaya kesalahan (mis. dibagi nol) ketahuan sebelum disimpan
function checkFormula(f: string, label: string, glass = false) {
  for (const S of [1, 2]) {
    try {
      evalFormula(f, { L: 120, T: 100, S, ...(glass ? { GW: 60, GH: 60 } : {}) });
    } catch (e) {
      throw bad(`${label}: ${(e as Error).message}`);
    }
  }
}

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(CalcProduct) private products: Repository<CalcProduct>,
    @InjectRepository(RecipeComponent) private components: Repository<RecipeComponent>,
    @InjectRepository(AccessoryRule) private rules: Repository<AccessoryRule>,
    @InjectRepository(ProfileType) private types: Repository<ProfileType>,
    @InjectRepository(Accessory) private accessories: Repository<Accessory>,
  ) {}

  private async product(code: string) {
    const p = await this.products.findOneBy({ code });
    if (!p) throw new NotFoundException('Produk tidak ditemukan');
    return p;
  }

  // Resep satu produk + pilihan untuk dropdown
  async getRecipe(code: string) {
    const product = await this.product(code);
    const [components, rules, types, accessories] = await Promise.all([
      this.components.find({ where: { productCode: code }, order: { sortOrder: 'ASC' } }),
      this.rules.find({ where: { productCode: code } }),
      this.types.find({ order: { series: 'ASC', name: 'ASC' } }),
      this.accessories.find({ order: { name: 'ASC' } }),
    ]);
    return {
      product,
      components,
      rules,
      profileTypes: types.map((t) => ({ code: t.code, name: t.name, series: t.series })),
      accessories: accessories.map((a) => ({ code: a.code, name: a.name, unit: a.unit })),
    };
  }

  // ---------- Produk ----------
  private glassFormulas(b: Body, current?: CalcProduct) {
    const w = 'glassWidthFormula' in b ? (str(b, 'glassWidthFormula', { optional: true }) ?? null) : (current?.glassWidthFormula ?? null);
    const h = 'glassHeightFormula' in b ? (str(b, 'glassHeightFormula', { optional: true }) ?? null) : (current?.glassHeightFormula ?? null);
    if ((w === null) !== (h === null)) throw bad('Rumus lebar dan tinggi kaca harus diisi dua-duanya, atau dikosongkan dua-duanya');
    if (w) checkFormula(w, 'Rumus lebar kaca');
    if (h) checkFormula(h, 'Rumus tinggi kaca');
    return { glassWidthFormula: w, glassHeightFormula: h };
  }

  async createProduct(b: Body) {
    only(b, ['code', 'name', 'priority', 'buildLabor', 'installLabor', 'minPrice', 'glassWidthFormula', 'glassHeightFormula']);
    const code = str(b, 'code', { max: 50 })!;
    if (!/^[A-Z0-9_]+$/.test(code)) throw bad('code hanya boleh huruf besar, angka, dan garis bawah');
    if (await this.products.findOneBy({ code })) throw bad('Kode produk sudah dipakai');
    const count = await this.products.count();
    const row = this.products.create({
      code,
      name: str(b, 'name', { max: 100 })!,
      priority: num(b, 'priority', true) ?? count + 1,
      buildLabor: num(b, 'buildLabor', true) ?? 0,
      installLabor: num(b, 'installLabor', true) ?? 0,
      minPrice: num(b, 'minPrice', true) ?? 0,
      ...this.glassFormulas(b),
    });
    return this.products.save(row);
  }

  async updateProduct(id: string, b: Body) {
    only(b, ['name', 'priority', 'glassWidthFormula', 'glassHeightFormula']);
    const row = await this.products.findOneBy({ id });
    if (!row) throw new NotFoundException('Produk tidak ditemukan');
    if ('name' in b) row.name = str(b, 'name', { max: 100 })!;
    if ('priority' in b) row.priority = num(b, 'priority')!;
    Object.assign(row, this.glassFormulas(b, row));
    return this.products.save(row);
  }

  // ---------- Potongan profil ----------
  private async typeExists(code: string) {
    if (!(await this.types.findOneBy({ code }))) throw bad(`Jenis profil ${code} tidak ada`);
  }

  async createComponent(b: Body) {
    only(b, ['productCode', 'name', 'profileTypeCode', 'lengthFormula', 'qtyFormula', 'sortOrder']);
    const productCode = str(b, 'productCode')!;
    await this.product(productCode);
    const profileTypeCode = str(b, 'profileTypeCode')!;
    await this.typeExists(profileTypeCode);
    const lengthFormula = str(b, 'lengthFormula')!;
    const qtyFormula = str(b, 'qtyFormula', { optional: true }) ?? '1';
    checkFormula(lengthFormula, 'Rumus panjang');
    checkFormula(qtyFormula, 'Rumus jumlah');
    const existing = await this.components.find({ where: { productCode } });
    const sortOrder = num(b, 'sortOrder', true) ?? Math.max(0, ...existing.map((c) => c.sortOrder)) + 1;
    return this.components.save(
      this.components.create({ productCode, name: str(b, 'name', { max: 100 })!, profileTypeCode, lengthFormula, qtyFormula, sortOrder }),
    );
  }

  async updateComponent(id: string, b: Body) {
    only(b, ['name', 'profileTypeCode', 'lengthFormula', 'qtyFormula', 'sortOrder']);
    const row = await this.components.findOneBy({ id });
    if (!row) throw new NotFoundException('Potongan tidak ditemukan');
    if ('name' in b) row.name = str(b, 'name', { max: 100 })!;
    if ('profileTypeCode' in b) {
      row.profileTypeCode = str(b, 'profileTypeCode')!;
      await this.typeExists(row.profileTypeCode);
    }
    if ('lengthFormula' in b) {
      row.lengthFormula = str(b, 'lengthFormula')!;
      checkFormula(row.lengthFormula, 'Rumus panjang');
    }
    if ('qtyFormula' in b) {
      row.qtyFormula = str(b, 'qtyFormula')!;
      checkFormula(row.qtyFormula, 'Rumus jumlah');
    }
    if ('sortOrder' in b) row.sortOrder = num(b, 'sortOrder')!;
    return this.components.save(row);
  }

  async deleteComponent(id: string) {
    const row = await this.components.findOneBy({ id });
    if (!row) throw new NotFoundException('Potongan tidak ditemukan');
    await this.components.remove(row);
    return { deleted: true };
  }

  // ---------- Aturan aksesoris ----------
  async createRule(b: Body) {
    only(b, ['productCode', 'accessoryCode', 'qtyFormula', 'optional']);
    const productCode = str(b, 'productCode')!;
    await this.product(productCode);
    const accessoryCode = str(b, 'accessoryCode')!;
    if (!(await this.accessories.findOneBy({ code: accessoryCode }))) throw bad(`Aksesoris ${accessoryCode} tidak ada`);
    if (await this.rules.findOneBy({ productCode, accessoryCode })) throw bad('Aksesoris ini sudah ada di resep produk');
    const qtyFormula = str(b, 'qtyFormula', { optional: true }) ?? '1';
    checkFormula(qtyFormula, 'Rumus jumlah', true);
    if (b.optional !== undefined && typeof b.optional !== 'boolean') throw bad('optional harus true atau false');
    return this.rules.save(
      this.rules.create({ productCode, accessoryCode, qtyFormula, optional: (b.optional as boolean | undefined) ?? false }),
    );
  }

  async updateRule(id: string, b: Body) {
    only(b, ['qtyFormula', 'optional']);
    const row = await this.rules.findOneBy({ id });
    if (!row) throw new NotFoundException('Aturan tidak ditemukan');
    if ('qtyFormula' in b) {
      row.qtyFormula = str(b, 'qtyFormula')!;
      checkFormula(row.qtyFormula, 'Rumus jumlah', true);
    }
    if ('optional' in b) {
      if (typeof b.optional !== 'boolean') throw bad('optional harus true atau false');
      row.optional = b.optional;
    }
    return this.rules.save(row);
  }

  async deleteRule(id: string) {
    const row = await this.rules.findOneBy({ id });
    if (!row) throw new NotFoundException('Aturan tidak ditemukan');
    await this.rules.remove(row);
    return { deleted: true };
  }

  // ---------- Daftar potong untuk ukuran tertentu ----------
  async preview(b: Body) {
    only(b, ['productCode', 'L', 'T', 'S']);
    const code = str(b, 'productCode')!;
    const L = num(b, 'L')!;
    const T = num(b, 'T')!;
    const S = num(b, 'S')!;
    if (!(L > 0 && T > 0 && S >= 1 && S <= 10)) throw bad('Lebar, tinggi, dan jumlah daun (1 sampai 10) harus diisi');

    const { product, components, rules, profileTypes, accessories } = await this.getRecipe(code);
    const typeName = new Map(profileTypes.map((t) => [t.code, t.name]));
    const accName = new Map(accessories.map((a) => [a.code, a.name]));
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const warnings: string[] = [];
    const vars = { L, T, S };

    const cuts = components.map((c) => {
      const length = evalFormula(c.lengthFormula, vars);
      const qty = evalFormula(c.qtyFormula, vars);
      if (length <= 0) warnings.push(`Panjang "${c.name}" jadi ${r2(length)} cm`);
      return { name: c.name, profile: typeName.get(c.profileTypeCode) ?? c.profileTypeCode, length: r2(length), qty: r2(qty) };
    });

    let glass: { width: number; height: number; pieces: number } | null = null;
    let GW = 0;
    let GH = 0;
    if (product.glassWidthFormula && product.glassHeightFormula) {
      GW = evalFormula(product.glassWidthFormula, vars);
      GH = evalFormula(product.glassHeightFormula, vars);
      if (GW <= 0 || GH <= 0) warnings.push(`Ukuran kaca jadi ${r2(GW)} x ${r2(GH)} cm`);
      glass = { width: r2(GW), height: r2(GH), pieces: S };
    }

    const acc = rules.map((r) => ({
      name: accName.get(r.accessoryCode) ?? r.accessoryCode,
      qty: r2(evalFormula(r.qtyFormula, { ...vars, GW, GH })),
      optional: r.optional,
    }));

    // Total panjang per jenis profil, berguna untuk membandingkan dengan batang yang dibeli
    const totals = new Map<string, number>();
    for (const c of cuts) totals.set(c.profile, (totals.get(c.profile) ?? 0) + (c.length * c.qty) / 100);
    const profileMeters = [...totals].map(([profile, meters]) => ({ profile, meters: r2(meters) }));

    return { product: { code: product.code, name: product.name }, cuts, profileMeters, glass, accessories: acc, warnings };
  }
}