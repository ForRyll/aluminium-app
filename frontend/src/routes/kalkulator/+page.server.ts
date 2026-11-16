import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_URL } from '../../lib/api';

// Daftar dari backend bisa berupa array langsung atau dibungkus { data: [...] }
const list = (j: any): any[] => (Array.isArray(j) ? j : (j?.data ?? j?.items ?? []));

export const load: PageServerLoad = async ({ fetch }) => {
  const [optRes, custRes, ordRes] = await Promise.all([
    fetch(`${API_URL}/calculator/options`),
    fetch(`${API_URL}/customers`),
    fetch(`${API_URL}/orders`),
  ]);
  if (!optRes.ok) throw new Error('Gagal memuat pilihan kalkulator');

  const customers = custRes.ok
    ? list(await custRes.json()).map((c: any) => ({ id: c.id, name: c.name ?? c.id }))
    : [];

  // Hanya order yang masih boleh diedit
  const orders = ordRes.ok
    ? list(await ordRes.json())
        .filter((o: any) => o.status === 'draft' || o.status === 'penawaran')
        .map((o: any) => ({
          id: o.id,
          label: `${o.orderNumber} - ${o.title}${o.customer?.name ? ` (${o.customer.name})` : ''}`,
        }))
    : [];

  return { options: await optRes.json(), customers, orders };
};

function readCalc(f: FormData) {
  const num = (k: string) => (f.get(k) ? Number(f.get(k)) : undefined);
  return {
    productCode: String(f.get('productCode') ?? ''),
    L: num('L'),
    T: num('T'),
    S: num('S'),
    brand: String(f.get('brand') ?? ''),
    mode: String(f.get('mode') ?? 'meter'),
    glassId: f.get('glassId') ? String(f.get('glassId')) : undefined,
    finishing: f.get('finishing') ? String(f.get('finishing')) : undefined,
    complex: f.get('complex') === 'on',
    withInstall: f.get('withInstall') === 'on',
    includeOptional: f.getAll('includeOptional').map(String),
    markupPct: num('markupPct'),
  };
}

const errText = (data: any, fallback: string) =>
  Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? fallback);

export const actions: Actions = {
  hitung: async ({ request, fetch }) => {
    const f = await request.formData();
    const res = await fetch(`${API_URL}/calculator/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readCalc(f)),
    });
    const data = await res.json();
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menghitung') });
    return { result: data };
  },

  keOrder: async ({ request, fetch }) => {
    const f = await request.formData();
    const target = String(f.get('target') ?? 'new');
    const body: Record<string, unknown> = { ...readCalc(f) };

    if (target === 'existing') {
      if (!f.get('orderId')) return fail(400, { orderError: 'Pilih order yang mau ditambah' });
      body.orderId = String(f.get('orderId'));
    } else {
      if (!f.get('customerId')) return fail(400, { orderError: 'Pilih pelanggan dulu' });
      body.customerId = String(f.get('customerId'));
      const title = String(f.get('title') ?? '').trim();
      if (title) body.title = title;
    }

    const res = await fetch(`${API_URL}/calculator/to-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return fail(400, { orderError: errText(data, 'Gagal membuat order') });
    throw redirect(303, `/orders/${data.orderId}`);
  },
};