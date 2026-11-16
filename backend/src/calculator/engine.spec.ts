import { calculate, CalcData } from './engine';
import { evalFormula } from './formula';

describe('evalFormula', () => {
  it('menghitung rumus', () => {
    expect(evalFormula('(L / 2) - 3', { L: 120 })).toBe(57);
    expect(evalFormula('2 * S + 1', { S: 2 })).toBe(5);
    expect(evalFormula('-L + 10', { L: 4 })).toBe(6);
  });
  it('menolak rumus berbahaya atau salah', () => {
    expect(() => evalFormula('X + 1', { L: 1 })).toThrow();
    expect(() => evalFormula('L +', { L: 1 })).toThrow();
    expect(() => evalFormula('process.exit()', { L: 1 })).toThrow();
    expect(() => evalFormula('L / 0', { L: 1 })).toThrow();
  });
});

const data: CalcData = {
  settings: { bar_length_m: 6, waste_standard_pct: 10, waste_complex_pct: 15, markup_standard_pct: 25, glass_min_m2: 0.25 },
  product: {
    code: 'JENDELA_SWING', name: 'Jendela swing', buildLabor: 175000, installLabor: 125000,
    minPrice: 500000, glassWidthFormula: '(L / S) - 25', glassHeightFormula: 'T - 8',
  },
  recipe: [
    { name: 'Kusen atas', profileTypeCode: 'KUSEN_M_3', lengthFormula: 'L', qtyFormula: '1' },
    { name: 'Kusen bawah', profileTypeCode: 'KUSEN_M_3', lengthFormula: 'L', qtyFormula: '1' },
    { name: 'Kusen samping', profileTypeCode: 'KUSEN_M_3', lengthFormula: 'T', qtyFormula: '2' },
    { name: 'Daun atas', profileTypeCode: 'DAUN_Z_3', lengthFormula: '(L / S) - 8', qtyFormula: 'S' },
    { name: 'Daun bawah', profileTypeCode: 'DAUN_Z_3', lengthFormula: '(L / S) - 8', qtyFormula: 'S' },
    { name: 'Daun samping', profileTypeCode: 'DAUN_Z_3', lengthFormula: 'T - 8', qtyFormula: '2 * S' },
  ],
  profileTypes: [
    { code: 'KUSEN_M_3', name: 'Kusen M 3 inci', series: '3', priceOverride: null },
    { code: 'DAUN_Z_3', name: 'Profil daun / Z 3 inci', series: '3', priceOverride: 115000 },
  ],
  profilePrices: [{ brand: 'Inkalum', series: '3', pricePerMeter: 95000 }],
  glass: { name: 'Bening / clear', thicknessMm: 5, pricePerM2: 170000 },
  accessories: {
    FRICTION_STAY: { name: 'Friction stay', unit: 'set', price: 105000 },
    HANDLE_SWING: { name: 'Handle jendela swing', unit: 'buah', price: 25000 },
    KARET_KACA: { name: 'Karet kaca', unit: 'm', price: 8000 },
    SEALANT: { name: 'Sealant silikon', unit: 'tube', price: 45000 },
    SEKRUP: { name: 'Sekrup', unit: 'buah', price: 500 },
    RIVET: { name: 'Rivet', unit: 'buah', price: 300 },
  },
  rules: [
    { accessoryCode: 'FRICTION_STAY', qtyFormula: '2 * S', optional: false },
    { accessoryCode: 'HANDLE_SWING', qtyFormula: 'S', optional: false },
    { accessoryCode: 'KARET_KACA', qtyFormula: '2 * (GW + GH) / 100 * S', optional: false },
    { accessoryCode: 'SEALANT', qtyFormula: '1', optional: false },
    { accessoryCode: 'SEKRUP', qtyFormula: '14', optional: false },
    { accessoryCode: 'RIVET', qtyFormula: '10', optional: false },
  ],
  overheads: [
    { name: 'Ongkir material lokal', kind: 'flat', amount: 50000, enabled: true },
    { name: 'Transportasi pemasangan', kind: 'flat', amount: 75000, enabled: true },
    { name: 'Mata gerinda', kind: 'per_unit', amount: 5000, enabled: true },
    { name: 'Bahan habis pakai', kind: 'per_unit', amount: 15000, enabled: true },
    { name: 'Listrik dan alat', kind: 'per_unit', amount: 10000, enabled: true },
    { name: 'Biaya tak terduga', kind: 'percent', amount: 5, enabled: false },
  ],
};

const base = { L: 120, T: 100, S: 1, brand: 'Inkalum', mode: 'meter' as const };
const cost = (r: ReturnType<typeof calculate>, label: string) =>
  r.lines.find((l) => l.label.startsWith(label))?.cost;

describe('AL-001 jendela swing 120 x 100', () => {
  const r = calculate(base, data);

  it('rincian cocok dengan dokumen', () => {
    expect(cost(r, 'Kusen M 3 inci')).toBe(418000);
    expect(cost(r, 'Profil daun / Z 3 inci')).toBe(469200);
    expect(cost(r, 'Waste profil')).toBe(88720);
    expect(cost(r, 'Bening / clear')).toBe(148580);
    expect(cost(r, 'Friction stay')).toBe(210000);
    expect(r.glassSize).toEqual({ width: 95, height: 92 });
  });

  it('modal beda Rp160 dari dokumen (karet kaca 3,74 m vs 3,76 m)', () => {
    expect(r.cost).toBe(1899420);
    expect(Math.abs(r.cost - 1899580)).toBeLessThanOrEqual(200);
  });

  it('harga jual sama dengan dokumen setelah pembulatan', () => {
    expect(r.price).toBe(2375000);
    expect(r.marginPct).toBeCloseTo(20.0, 0);
  });
});

describe('mode batang utuh', () => {
  it('membeli 1 batang kusen dan 1 batang daun, tanpa waste', () => {
    const r = calculate({ ...base, mode: 'bar' }, data);
    const profil = r.lines.filter((l) => l.group === 'profil');
    expect(profil.map((l) => l.qty)).toEqual([1, 1]);
    expect(profil.reduce((s, l) => s + l.cost, 0)).toBe(570000 + 690000);
    expect(r.lines.some((l) => l.group === 'waste')).toBe(false);
  });
});

describe('aturan lain', () => {
  it('menaikkan ke harga minimum', () => {
    const r = calculate({ ...base, L: 40, T: 40 }, { ...data, product: { ...data.product, minPrice: 9000000 } });
    expect(r.price).toBe(9000000);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it('finishing putih menambah 10% biaya profil', () => {
    const r = calculate({ ...base, finishingPct: 10 }, data);
    expect(cost(r, 'Finishing')).toBe(88720);
  });
  it('error jika harga merk belum ada', () => {
    expect(() => calculate({ ...base, brand: 'Tidak Ada' }, data)).toThrow(/belum ada/);
  });
});