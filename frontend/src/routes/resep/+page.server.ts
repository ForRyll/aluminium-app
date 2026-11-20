import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_URL } from '../../lib/api';

const KINDS = ['product', 'component', 'rule'];
const UUID = /^[0-9a-f-]{36}$/i;

export const load: PageServerLoad = async ({ fetch, url }) => {
  const optRes = await fetch(`${API_URL}/calculator/options`);
  if (!optRes.ok) throw error(500, 'Gagal memuat daftar produk');
  const opt = await optRes.json();
  const products: { code: string; name: string }[] = opt.products;

  const code = url.searchParams.get('p') ?? products[0]?.code ?? null;
  let recipe = null;
  if (code) {
    const r = await fetch(`${API_URL}/calculator/recipes/${encodeURIComponent(code)}`);
    if (!r.ok) throw error(r.status === 404 ? 404 : 500, 'Resep produk tidak bisa dimuat');
    recipe = await r.json();
  }
  return { products, code, recipe };
};

// n_ = angka (kosong jadi null), b_ = true/false, s_ = teks
function readBody(f: FormData) {
  const body: Record<string, unknown> = {};
  for (const [k, v] of f.entries()) {
    if (k === 'kind' || k === 'id') continue;
    const s = String(v);
    const key = k.slice(2);
    if (k.startsWith('n_')) body[key] = s.trim() === '' ? null : Number(s);
    else if (k.startsWith('b_')) body[key] = s === 'true';
    else if (k.startsWith('s_')) body[key] = s;
  }
  return body;
}

const errText = (data: any, fallback: string) =>
  Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? fallback);

const json = { 'Content-Type': 'application/json' };

export const actions: Actions = {
  simpan: async ({ request, fetch }) => {
    const f = await request.formData();
    const kind = String(f.get('kind') ?? '');
    const id = String(f.get('id') ?? '');
    if (!KINDS.includes(kind) || !UUID.test(id)) return fail(400, { error: 'Permintaan tidak valid' });

    const res = await fetch(`${API_URL}/calculator/recipes/${kind}/${id}`, {
      method: 'PATCH',
      headers: json,
      body: JSON.stringify(readBody(f)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menyimpan') });
    return { saved: true };
  },

  tambah: async ({ request, fetch }) => {
    const f = await request.formData();
    const kind = String(f.get('kind') ?? '');
    if (!KINDS.includes(kind)) return fail(400, { error: 'Permintaan tidak valid' });

    const res = await fetch(`${API_URL}/calculator/recipes/${kind}`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify(readBody(f)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menambah') });
    // Produk baru: langsung buka resepnya
    if (kind === 'product') throw redirect(303, `/resep?p=${encodeURIComponent(data.code)}`);
    return { saved: true };
  },

  hapus: async ({ request, fetch }) => {
    const f = await request.formData();
    const kind = String(f.get('kind') ?? '');
    const id = String(f.get('id') ?? '');
    if (!['component', 'rule'].includes(kind) || !UUID.test(id)) {
      return fail(400, { error: 'Permintaan tidak valid' });
    }
    const res = await fetch(`${API_URL}/calculator/recipes/${kind}/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menghapus') });
    return { deleted: true };
  },

  preview: async ({ request, fetch }) => {
    const f = await request.formData();
    const res = await fetch(`${API_URL}/calculator/recipes/preview`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        productCode: String(f.get('productCode') ?? ''),
        L: Number(f.get('L')),
        T: Number(f.get('T')),
        S: Number(f.get('S')),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal membuat daftar potong') });
    return { preview: data };
  },
};