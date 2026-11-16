import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Accessory, AccessoryRule, CalcProduct, CalcSetting, Finishing, GlassType,
  Overhead, ProfilePrice, ProfileType, RecipeComponent,
} from './calculator.entities';
import { calculate, CalcData } from './engine';
import { CalculateDto, ToOrderDto } from './calculator.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(CalcProduct) private products: Repository<CalcProduct>,
    @InjectRepository(RecipeComponent) private recipes: Repository<RecipeComponent>,
    @InjectRepository(ProfileType) private types: Repository<ProfileType>,
    @InjectRepository(ProfilePrice) private prices: Repository<ProfilePrice>,
    @InjectRepository(GlassType) private glasses: Repository<GlassType>,
    @InjectRepository(Accessory) private accessories: Repository<Accessory>,
    @InjectRepository(AccessoryRule) private rules: Repository<AccessoryRule>,
    @InjectRepository(Finishing) private finishings: Repository<Finishing>,
    @InjectRepository(Overhead) private overheads: Repository<Overhead>,
    @InjectRepository(CalcSetting) private settings: Repository<CalcSetting>,
    private readonly orders: OrdersService,
  ) {}

  // Data pilihan untuk form kalkulator
  async options() {
    const [products, brands, glasses, finishings, optionalRules, accessories, settings] =
      await Promise.all([
        this.products.find({ order: { priority: 'ASC' } }),
        this.prices.find(),
        this.glasses.find({ order: { name: 'ASC', thicknessMm: 'ASC' } }),
        this.finishings.find({ order: { percent: 'ASC' } }),
        this.rules.find({ where: { optional: true } }),
        this.accessories.find(),
        this.settings.find(),
      ]);
    const accName = new Map(accessories.map((a) => [a.code, a.name]));
    return {
      products: products.map((p) => ({ code: p.code, name: p.name, minPrice: p.minPrice })),
      brands: [...new Set(brands.map((b) => b.brand))],
      glasses: glasses.map((g) => ({
        id: g.id, label: `${g.name} ${g.thicknessMm} mm`, pricePerM2: g.pricePerM2,
      })),
      finishings: finishings.map((f) => ({ name: f.name, percent: f.percent })),
      optionalAccessories: optionalRules.map((r) => ({
        productCode: r.productCode, code: r.accessoryCode, name: accName.get(r.accessoryCode) ?? r.accessoryCode,
      })),
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    };
  }

  async calculate(dto: CalculateDto) {
    const product = await this.products.findOneBy({ code: dto.productCode });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    const [recipe, rules, types, prices, accessories, overheads, settings] = await Promise.all([
      this.recipes.find({ where: { productCode: product.code }, order: { sortOrder: 'ASC' } }),
      this.rules.find({ where: { productCode: product.code } }),
      this.types.find(),
      this.prices.find(),
      this.accessories.find(),
      this.overheads.find(),
      this.settings.find(),
    ]);

    let glass: GlassType | null = null;
    if (dto.glassId) {
      glass = await this.glasses.findOneBy({ id: dto.glassId });
      if (!glass) throw new BadRequestException('Jenis kaca tidak ditemukan');
    }

    let finishingPct = 0;
    if (dto.finishing) {
      const f = await this.finishings.findOneBy({ name: dto.finishing });
      if (!f) throw new BadRequestException('Finishing tidak ditemukan');
      finishingPct = f.percent;
    }

    const data: CalcData = {
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      product,
      recipe,
      profileTypes: types,
      profilePrices: prices,
      glass,
      accessories: Object.fromEntries(accessories.map((a) => [a.code, a])),
      rules,
      overheads,
    };

    try {
      const result = calculate(
        {
          L: dto.L, T: dto.T, S: dto.S, brand: dto.brand, mode: dto.mode,
          complex: dto.complex, withInstall: dto.withInstall, finishingPct,
          includeOptional: dto.includeOptional, markupPct: dto.markupPct, roundTo: dto.roundTo,
        },
        data,
      );
      return { product: { code: product.code, name: product.name }, ...result };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  // Hasil kalkulator -> order baru, atau ditambahkan ke order draft/penawaran
  async toOrder(dto: ToOrderDto) {
    if (!dto.customerId && !dto.orderId) {
      throw new BadRequestException('Pilih pelanggan (order baru) atau order yang sudah ada');
    }
    // Hitung ulang di server, angka dari browser tidak dipercaya
    const result = await this.calculate(dto);
    const fmt = (n: number) => n.toLocaleString('id-ID');

    // Satu baris kalkulator = satu item (jumlah 1), supaya modal persis sama
    const items = result.lines
      .filter((l) => l.group !== 'upah' && l.group !== 'overhead')
      .map((l) => ({
        description: `${l.label} (${l.qty} ${l.unit} x Rp${fmt(l.unitPrice)})`.slice(0, 200),
        unit: 'paket',
        quantity: 1,
        unitPrice: l.cost,
      }));

    const sum = (f: (l: (typeof result.lines)[number]) => boolean) =>
      result.lines.filter(f).reduce((s, l) => s + l.cost, 0);
    const laborCost = sum((l) => l.group === 'upah');
    const deliveryCost = sum(
      (l) => l.group === 'overhead' && /ongkir|transport|kirim/i.test(l.label),
    );
    const otherCost = sum((l) => l.group === 'overhead') - deliveryCost;

    const notes =
      `Kalkulator: ${result.product.name} ${dto.L} x ${dto.T} cm, ${dto.S} daun, ${dto.brand}, ` +
      `${dto.finishing ?? 'tanpa finishing'}, ${dto.mode === 'bar' ? 'batang utuh' : 'meter lari'}. ` +
      `Data harga masih simulasi.`;

    if (!dto.orderId) {
      const order = await this.orders.create({
        customerId: dto.customerId as string,
        title: dto.title ?? `${result.product.name} ${dto.L} x ${dto.T} cm`,
        items,
        laborCost,
        deliveryCost,
        otherCost,
        offeredPrice: result.price,
        notes,
      });
      return { orderId: order.id, orderNumber: order.orderNumber, created: true };
    }

    // Tambah ke order yang sudah ada (hanya draft/penawaran, dicek oleh OrdersService)
    const o = await this.orders.findOne(dto.orderId);
    const existing = o.items.map((i) => ({
      materialId: i.material?.id,
      description: i.description,
      unit: i.unit,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    }));
    const updated = await this.orders.update(dto.orderId, {
      items: [...existing, ...items],
      laborCost: Number(o.laborCost) + laborCost,
      deliveryCost: Number(o.deliveryCost) + deliveryCost,
      otherCost: Number(o.otherCost) + otherCost,
      offeredPrice: Number(o.offeredPrice ?? 0) + result.price,
      notes: [o.notes, notes].filter(Boolean).join('\n'),
    });
    return { orderId: updated.id, orderNumber: updated.orderNumber, created: false };
  }
}