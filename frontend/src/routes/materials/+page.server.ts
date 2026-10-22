import { fail } from '@sveltejs/kit';
import { API_URL, type Material } from '../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Dijalankan di server: ambil daftar material dari backend
export const load: PageServerLoad = async ({ fetch, url }) => {
    const search = url.searchParams.get('search') ?? '';
    const res = await fetch(`${API_URL}/materials?search=${encodeURIComponent(search)}`);

    if (!res.ok) {
        return { materials: [] as Material[], search, error: `Backend membalas ${res.status}` };
    }
    return { materials: (await res.json()) as Material[], search, error: null };
};

// Ambil daftar pesan error dari balasan backend
async function readErrors(res: Response): Promise<string[]> {
    const err = await res.json().catch(() => null);
    return Array.isArray(err?.message)
        ? err.message
        : [err?.message ?? `Backend membalas ${res.status}`];
}

export const actions: Actions = {
    // Tambah material baru
    create: async ({ request, fetch }) => {
        const form = await request.formData();

        const body = {
            name: String(form.get('name') ?? '').trim(),
            category: String(form.get('category') ?? '').trim(),
            brand: String(form.get('brand') ?? '').trim() || undefined,
            unit: String(form.get('unit') ?? '').trim(),
            price: Number(form.get('price')),
            lengthPerUnit: form.get('lengthPerUnit') ? Number(form.get('lengthPerUnit')) : undefined
        };

        const res = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) return fail(res.status, { messages: await readErrors(res), values: body });
        return { success: true, message: 'Material berhasil ditambahkan.' };
    },

    // Ubah harga satu material
    update: async ({ request, fetch }) => {
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        const price = Number(form.get('price'));

        const res = await fetch(`${API_URL}/materials/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price })
        });

        if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
        return { success: true, message: 'Harga berhasil diubah.' };
    },

    // Nonaktifkan material (tidak dihapus, supaya riwayat order tetap utuh)
    deactivate: async ({ request, fetch }) => {
        const form = await request.formData();
        const id = String(form.get('id') ?? '');

        const res = await fetch(`${API_URL}/materials/${id}`, { method: 'DELETE' });

        if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
        return { success: true, message: 'Material dinonaktifkan.' };
    }
};
