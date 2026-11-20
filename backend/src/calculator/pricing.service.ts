import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Accessory, CalcProduct, CalcSetting, Finishing, GlassType, Overhead,
  ProfilePrice, ProfileType,
} from './calculator.entities';

type FieldType = 'str' | 'num' | 'numnull' | 'bool' | { enum: string[] };

interface Kind {
  repo: Repository<any>;
  fields: Record<string, FieldType>; // kolom yang boleh diubah
  createOnly?: Record<string, FieldType>; // kolom tambahan saat membuat baru
  required?: string[]; // wajib saat membuat baru
  unique?: string[]; // kombinasi kolom yang tidak boleh kembar
}

const STATUS: FieldType = { enum: ['belum_diverifikasi', 'terverifikasi'] };
const bad = (m: string) => new BadRequestException(m);

function checkValue(key: string, t: FieldType, v: unknown): unknown {
  if (t === 'str') {
    if (typeof v !== 'string' || !v.trim() || v.length > 200) throw bad(`${key} tidak valid`);
    return v.trim();
  }
  if (t === 'num' || t === 'numnull') {
    if (t === 'numnull' && (v === null || v === '')) return null;
    const n = typeof v === 'number' ? v : Number(v);
    if (v === '' || v === null || !Number.isFinite(n) || n < 0 || n > 1e10) {
      throw bad(`${key} harus angka 0 atau lebih`);
    }
    return n;
  }
  if (t === 'bool') {
    if (typeof v !== 'boolean') throw bad(`${key} harus true atau false`);
    return v;
  }
  if (typeof v !== 'string' || !t.enum.includes(v)) {
    throw bad(`${key} harus salah satu dari: ${t.enum.join(', ')}`);
  }
  return v;
}

@Injectable()
export class PricingService {
  private kinds: Record<string, Kind>;

  constructor(
    @InjectRepository(ProfilePrice) private profilePrices: Repository<ProfilePrice>,
    @InjectRepository(ProfileType) private profileTypes: Repository<ProfileType>,
    @InjectRepository(GlassType) private glasses: Repository<GlassType>,
    @InjectRepository(Accessory) private accessories: Repository<Accessory>,
    @InjectRepository(Finishing) private finishings: Repository<Finishing>,
    @InjectRepository(Overhead) private overheads: Repository<Overhead>,
    @InjectRepository(CalcSetting) private settings: Repository<CalcSetting>,
    @InjectRepository(CalcProduct) private products: Repository<CalcProduct>,
  ) {
    this.kinds = {
      'profile-price': {
        repo: this.profilePrices,
        fields: { brand: 'str', series: { enum: ['3', '4'] }, pricePerMeter: 'num', status: STATUS },
        required: ['brand', 'series', 'pricePerMeter'],
        unique: ['brand', 'series'],
      },
        'profile-type': {
        repo: this.profileTypes,
        fields: { name: 'str', priceOverride: 'numnull' },
        createOnly: { code: 'str', series: { enum: ['3', '4'] } },
        required: ['code', 'name', 'series'],
        unique: ['code'],
      },
      glass: {
        repo: this.glasses,
        fields: { name: 'str', thicknessMm: 'num', pricePerM2: 'num', status: STATUS },
        required: ['name', 'thicknessMm', 'pricePerM2'],
        unique: ['name', 'thicknessMm'],
      },
      accessory: {
        repo: this.accessories,
        fields: { name: 'str', unit: 'str', price: 'num', status: STATUS },
        createOnly: { code: 'str' },
        required: ['code', 'name', 'unit', 'price'],
        unique: ['code'],
      },
      finishing: {
        repo: this.finishings,
        fields: { name: 'str', percent: 'num' },
        required: ['name', 'percent'],
        unique: ['name'],
      },
      overhead: {
        repo: this.overheads,
        fields: {
          name: 'str', kind: { enum: ['flat', 'per_unit', 'percent'] }, amount: 'num', enabled: 'bool',
        },
        required: ['name', 'kind', 'amount'],
      },
      setting: { repo: this.settings, fields: { value: 'num' } },
      product: {
        repo: this.products,
        fields: { buildLabor: 'num', installLabor: 'num', minPrice: 'num', status: STATUS },
      },
    };
  }

  // Semua data yang bisa diatur, untuk halaman Harga & Rumus
  async all() {
    const [profilePrices, profileTypes, glasses, accessories, finishings, overheads, settings, products] =
      await Promise.all([
        this.profilePrices.find({ order: { brand: 'ASC', series: 'ASC' } }),
        this.profileTypes.find({ order: { series: 'ASC', name: 'ASC' } }),
        this.glasses.find({ order: { name: 'ASC', thicknessMm: 'ASC' } }),
        this.accessories.find({ order: { name: 'ASC' } }),
        this.finishings.find({ order: { percent: 'ASC' } }),
        this.overheads.find({ order: { name: 'ASC' } }),
        this.settings.find({ order: { key: 'ASC' } }),
        this.products.find({ order: { priority: 'ASC' } }),
      ]);
    return { profilePrices, profileTypes, glasses, accessories, finishings, overheads, settings, products };
  }

  private kind(name: string): Kind {
    const k = this.kinds[name];
    if (!k) throw new NotFoundException(`Jenis data "${name}" tidak dikenal`);
    return k;
  }

  private clean(allowed: Record<string, FieldType>, body: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (!(key in allowed)) throw bad(`Kolom "${key}" tidak boleh diubah`);
      out[key] = checkValue(key, allowed[key], body[key]);
    }
    return out;
  }

  // Tolak kalau kombinasi kolom unik sudah dipakai baris lain
  private async checkUnique(k: Kind, values: Record<string, unknown>, selfId?: string) {
    if (!k.unique) return;
    const norm = (v: unknown) => String(v).trim().toLowerCase();
    const rows = await k.repo.find();
    const clash = rows.some(
      (r) => r.id !== selfId && k.unique!.every((c) => norm(r[c]) === norm(values[c])),
    );
    if (clash) throw bad(`Data dengan ${k.unique.join(' + ')} yang sama sudah ada`);
  }

  async create(name: string, body: Record<string, unknown>) {
    const k = this.kind(name);
    const values = this.clean({ ...k.fields, ...(k.createOnly ?? {}) }, body ?? {});
    if (!k.required) throw bad('Jenis data ini tidak bisa ditambah');
    for (const r of k.required) if (!(r in values)) throw bad(`${r} wajib diisi`);
    if (typeof values.code === 'string' && !/^[A-Z0-9_]+$/.test(values.code)) {
      throw bad('code hanya boleh huruf besar, angka, dan garis bawah');
    }
    await this.checkUnique(k, values);
    return k.repo.save(k.repo.create(values));
  }

  async update(name: string, id: string, body: Record<string, unknown>) {
    const k = this.kind(name);
    const row = await k.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Data tidak ditemukan');
    const values = this.clean(k.fields, body ?? {});
    if (Object.keys(values).length === 0) throw bad('Tidak ada yang diubah');
    await this.checkUnique(k, { ...row, ...values }, id);
    Object.assign(row, values);
    return k.repo.save(row);
  }
}