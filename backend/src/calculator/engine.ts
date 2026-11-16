import { evalFormula } from './formula';

export interface CalcInput {
  L: number; // lebar cm
  T: number; // tinggi cm
  S: number; // jumlah daun
  brand: string;
  mode: 'meter' | 'bar'; // meter lari + waste, atau batang utuh
  complex?: boolean; // pekerjaan rumit -> waste lebih besar
  finishingPct?: number; // tambahan % pada biaya profil
  withInstall?: boolean; // default true
  includeOptional?: string[]; // kode aksesoris opsional yang dipakai
  markupPct?: number; // default dari pengaturan
  roundTo?: number; // pembulatan harga jual ke atas, default 1000
}

export interface CalcData {
  settings: Record<string, number>;
  product: {
    code: string; name: string; buildLabor: number; installLabor: number;
    minPrice: number; glassWidthFormula: string | null; glassHeightFormula: string | null;
  };
  recipe: { name: string; profileTypeCode: string; lengthFormula: string; qtyFormula: string }[];
  profileTypes: { code: string; name: string; series: string; priceOverride: number | null }[];
  profilePrices: { brand: string; series: string; pricePerMeter: number }[];
  glass: { name: string; thicknessMm: number; pricePerM2: number } | null;
  accessories: Record<string, { name: string; unit: string; price: number }>;
  rules: { accessoryCode: string; qtyFormula: string; optional: boolean }[];
  overheads: { name: string; kind: string; amount: number; enabled: boolean }[];
}

export interface CalcLine {
  group: 'profil' | 'finishing' | 'waste' | 'kaca' | 'aksesoris' | 'upah' | 'overhead';
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
  cost: number;
}

export interface CalcResult {
  lines: CalcLine[];
  cost: number; // modal
  markupPct: number;
  rawPrice: number;
  price: number; // harga jual (sudah dibulatkan)
  profit: number;
  marginPct: number; // untung dari harga jual
  glassSize: { width: number; height: number } | null;
  warnings: string[];
}

const rp = (n: number) => Math.round(n);
const r2 = (n: number) => Math.round(n * 100) / 100;

export function calculate(input: CalcInput, d: CalcData): CalcResult {
  const { L, T, S } = input;
  if (!(L > 0 && T > 0 && S >= 1)) {
    throw new Error('Lebar, tinggi, dan jumlah daun harus lebih dari 0');
  }
  const lines: CalcLine[] = [];
  const warnings: string[] = [];
  const barM = d.settings.bar_length_m ?? 6;
  const vars: Record<string, number> = { L, T, S };

  // 1. Profil: kumpulkan panjang total per jenis profil
  const totalCm = new Map<string, number>();
  for (const c of d.recipe) {
    const len = evalFormula(c.lengthFormula, vars);
    const qty = evalFormula(c.qtyFormula, vars);
    if (len <= 0) warnings.push(`Panjang "${c.name}" jadi ${r2(len)} cm, cek ukuran atau rumus`);
    if (mode_bar(input) && len > barM * 100) warnings.push(`"${c.name}" (${r2(len)} cm) lebih panjang dari satu batang`);
    totalCm.set(c.profileTypeCode, (totalCm.get(c.profileTypeCode) ?? 0) + len * qty);
  }

  let profileCost = 0;
  for (const [code, cm] of totalCm) {
    const type = d.profileTypes.find((t) => t.code === code);
    if (!type) throw new Error(`Jenis profil ${code} tidak ada`);
    const price =
      type.priceOverride ??
      d.profilePrices.find((p) => p.brand === input.brand && p.series === type.series)?.pricePerMeter;
    if (price == null) throw new Error(`Harga ${input.brand} seri ${type.series} inci belum ada`);
    const meters = cm / 100;
    if (input.mode === 'bar') {
      const bars = Math.ceil(meters / barM - 1e-9);
      const cost = rp(bars * barM * price);
      profileCost += cost;
      lines.push({ group: 'profil', label: type.name, qty: bars, unit: 'batang', unitPrice: rp(barM * price), cost });
    } else {
      const cost = rp(meters * price);
      profileCost += cost;
      lines.push({ group: 'profil', label: type.name, qty: r2(meters), unit: 'm', unitPrice: price, cost });
    }
  }

  // 2. Finishing (persen dari biaya profil)
  let finishingCost = 0;
  if (input.finishingPct && input.finishingPct > 0) {
    finishingCost = rp((profileCost * input.finishingPct) / 100);
    lines.push({ group: 'finishing', label: `Finishing +${input.finishingPct}%`, qty: 1, unit: 'paket', unitPrice: finishingCost, cost: finishingCost });
  }

  // 3. Waste: hanya mode meter lari (mode batang sudah menghitung sisa lewat pembulatan)
  if (input.mode === 'meter') {
    const pct = input.complex ? d.settings.waste_complex_pct ?? 15 : d.settings.waste_standard_pct ?? 10;
    const cost = rp(((profileCost + finishingCost) * pct) / 100);
    lines.push({ group: 'waste', label: `Waste profil ${pct}%`, qty: 1, unit: 'paket', unitPrice: cost, cost });
  }

  // 4. Kaca
  let GW = 0;
  let GH = 0;
  let glassSize: CalcResult['glassSize'] = null;
  if (d.product.glassWidthFormula && d.product.glassHeightFormula) {
    if (!d.glass) {
      warnings.push('Jenis kaca belum dipilih');
    } else {
      GW = evalFormula(d.product.glassWidthFormula, vars);
      GH = evalFormula(d.product.glassHeightFormula, vars);
      if (GW <= 0 || GH <= 0) warnings.push(`Ukuran kaca jadi ${r2(GW)} x ${r2(GH)} cm, cek ukuran produk`);
      glassSize = { width: r2(GW), height: r2(GH) };
      const minM2 = d.settings.glass_min_m2 ?? 0;
      const area = Math.max((GW * GH) / 10000, minM2);
      const cost = rp(area * S * d.glass.pricePerM2);
      lines.push({
        group: 'kaca',
        label: `${d.glass.name} ${d.glass.thicknessMm} mm (${r2(GW)} x ${r2(GH)} cm x ${S})`,
        qty: r2(area * S), unit: 'm2', unitPrice: d.glass.pricePerM2, cost,
      });
    }
  }

  // 5. Aksesoris
  const accVars = { ...vars, GW, GH };
  for (const rule of d.rules) {
    if (rule.optional && !input.includeOptional?.includes(rule.accessoryCode)) continue;
    const acc = d.accessories[rule.accessoryCode];
    if (!acc) throw new Error(`Aksesoris ${rule.accessoryCode} tidak ada`);
    const qty = evalFormula(rule.qtyFormula, accVars);
    lines.push({ group: 'aksesoris', label: acc.name, qty: r2(qty), unit: acc.unit, unitPrice: acc.price, cost: rp(qty * acc.price) });
  }

  // 6. Upah
  if (d.product.buildLabor > 0) {
    lines.push({ group: 'upah', label: 'Upah pembuatan', qty: 1, unit: 'unit', unitPrice: d.product.buildLabor, cost: rp(d.product.buildLabor) });
  }
  if (input.withInstall !== false && d.product.installLabor > 0) {
    lines.push({ group: 'upah', label: 'Upah pemasangan', qty: 1, unit: 'unit', unitPrice: d.product.installLabor, cost: rp(d.product.installLabor) });
  }

  // 7. Biaya lain (flat dan per_unit dulu, persen dihitung dari modal produksi)
  for (const o of d.overheads) {
    if (!o.enabled || o.kind === 'percent') continue;
    lines.push({ group: 'overhead', label: o.name, qty: 1, unit: o.kind === 'flat' ? 'pekerjaan' : 'unit', unitPrice: o.amount, cost: rp(o.amount) });
  }
  const baseCost = lines.reduce((s, l) => s + l.cost, 0);
  for (const o of d.overheads) {
    if (!o.enabled || o.kind !== 'percent') continue;
    const cost = rp((baseCost * o.amount) / 100);
    lines.push({ group: 'overhead', label: o.name, qty: 1, unit: 'paket', unitPrice: cost, cost });
  }

  // 8. Modal, harga jual, margin
  const cost = lines.reduce((s, l) => s + l.cost, 0);
  const markupPct = input.markupPct ?? d.settings.markup_standard_pct ?? 25;
  const rawPrice = rp(cost * (1 + markupPct / 100));
  const roundTo = input.roundTo ?? 1000;
  let price = roundTo > 0 ? Math.ceil(rawPrice / roundTo) * roundTo : rawPrice;
  if (d.product.minPrice > 0 && price < d.product.minPrice) {
    warnings.push(`Harga di bawah harga minimum produk, dinaikkan ke ${d.product.minPrice}`);
    price = d.product.minPrice;
  }
  const profit = price - cost;
  const marginPct = price > 0 ? r2((profit / price) * 100) : 0;

  return { lines, cost, markupPct, rawPrice, price, profit, marginPct, glassSize, warnings };
}

function mode_bar(i: CalcInput) {
  return i.mode === 'bar';
}