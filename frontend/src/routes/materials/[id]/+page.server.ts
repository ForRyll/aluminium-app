import { error, fail } from '@sveltejs/kit';
import { API_URL, type Material } from '../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Dijalankan di server: ambil satu material (termasuk yang nonaktif)
export const load: PageServerLoad = async ({ fetch, params }) => {
	const res = await fetch(`${API_URL}/materials/${params.id}`);
	if (res.status === 404) error(404, 'Material tidak ditemukan');
	if (!res.ok) error(502, 'Backend tidak bisa dihubungi');
	return { material: (await res.json()) as Material };
};

// Ambil daftar pesan error dari balasan backend
async function readErrors(res: Response): Promise<string[]> {
	const err = await res.json().catch(() => null);
	return Array.isArray(err?.message)
		? err.message
		: [err?.message ?? `Backend membalas ${res.status}`];
}

export const actions: Actions = {
	// Simpan perubahan detail material
	save: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const text = (k: string) => String(form.get(k) ?? '').trim();
		const length = text('lengthPerUnit');

		const body: Record<string, unknown> = {
			name: text('name'),
			category: text('category'),
			brand: text('brand') || null, // kosong berarti merknya dihapus
			unit: text('unit'),
			price: Number(form.get('price'))
		};
		// Panjang kosong berarti tidak diubah
		if (length !== '') body.lengthPerUnit = Number(length);

		const res = await fetch(`${API_URL}/materials/${params.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Perubahan disimpan.' };
	},

	// Aktifkan atau nonaktifkan
	toggle: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const makeActive = form.get('active') === 'true';

		const res = makeActive
			? await fetch(`${API_URL}/materials/${params.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ isActive: true })
				})
			: await fetch(`${API_URL}/materials/${params.id}`, { method: 'DELETE' });

		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return {
			success: true,
			message: makeActive ? 'Material diaktifkan kembali.' : 'Material dinonaktifkan.'
		};
	}
};