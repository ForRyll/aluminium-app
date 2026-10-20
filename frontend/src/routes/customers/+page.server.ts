import { fail } from '@sveltejs/kit';
import { API_URL } from '../../lib/api';
import type { Actions } from './$types';

export const actions: Actions = {
	// Tambah pelanggan baru
	create: async ({ request, fetch }) => {
		const form = await request.formData();

		// Kolom kosong dikirim sebagai undefined supaya tidak kena validasi format
		const body = {
			name: String(form.get('name') ?? '').trim(),
			phone: String(form.get('phone') ?? '').trim() || undefined,
			address: String(form.get('address') ?? '').trim() || undefined,
			notes: String(form.get('notes') ?? '').trim() || undefined
		};

		const res = await fetch(`${API_URL}/customers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			// Backend mengirim daftar pesan validasi, tampilkan apa adanya
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages, values: body });
		}

		return { success: true, message: 'Pelanggan berhasil ditambahkan.' };
	}
};