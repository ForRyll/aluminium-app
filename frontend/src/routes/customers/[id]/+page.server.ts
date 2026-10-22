import { error, fail, redirect } from '@sveltejs/kit';
import { API_URL, type Customer } from '../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Dijalankan di server: ambil data satu pelanggan
export const load: PageServerLoad = async ({ fetch, params }) => {
	const res = await fetch(`${API_URL}/customers/${params.id}`);
	if (res.status === 404) error(404, 'Pelanggan tidak ditemukan');
	if (!res.ok) error(502, 'Backend tidak bisa dihubungi');
	return { customer: (await res.json()) as Customer };
};

// Ambil daftar pesan error dari balasan backend
async function readErrors(res: Response): Promise<string[]> {
	const err = await res.json().catch(() => null);
	return Array.isArray(err?.message)
		? err.message
		: [err?.message ?? `Backend membalas ${res.status}`];
}

export const actions: Actions = {
	// Simpan perubahan. Kolom kosong dikirim null supaya isinya terhapus.
	update: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const body = {
			name: String(form.get('name') ?? '').trim(),
			phone: String(form.get('phone') ?? '').trim() || null,
			address: String(form.get('address') ?? '').trim() || null,
			notes: String(form.get('notes') ?? '').trim() || null
		};

		const res = await fetch(`${API_URL}/customers/${params.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Perubahan disimpan.' };
	},

	// Hapus pelanggan. Ditolak backend kalau masih punya order.
	remove: async ({ fetch, params }) => {
		const res = await fetch(`${API_URL}/customers/${params.id}`, { method: 'DELETE' });
		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		redirect(303, '/customers');
	}
};