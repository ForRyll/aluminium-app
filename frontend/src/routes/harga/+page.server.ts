import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { API_URL } from '../../lib/api';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`${API_URL}/calculator/pricing`);
  if (!res.ok) throw new Error('Gagal memuat data harga');
  return { p: await res.json() };
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

export const actions: Actions = {
  simpan: async ({ request, fetch }) => {
    const f = await request.formData();
    const kind = String(f.get('kind') ?? '');
    const id = String(f.get('id') ?? '');
    const res = await fetch(`${API_URL}/calculator/pricing/${kind}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readBody(f)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menyimpan') });
    return { saved: true };
  },

  tambah: async ({ request, fetch }) => {
    const f = await request.formData();
    const kind = String(f.get('kind') ?? '');
    const res = await fetch(`${API_URL}/calculator/pricing/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readBody(f)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(400, { error: errText(data, 'Gagal menambah') });
    return { saved: true };
  },
};