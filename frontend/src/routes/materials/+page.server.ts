import { fail } from '@sveltejs/kit';
import { API_URL } from '../../lib/api';
import type { Actions } from './$types';

export const actions: Actions = {
	// Dijalankan saat form "Tambah Material" dikirim
	create: async ({ request, fetch }) => {
		const form = await request.formData();

		// Nilai dari form selalu teks, ubah jadi angka sebelum dikirim ke backend
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

		if (!res.ok) {
			// Backend mengirim daftar pesan validasi, tampilkan apa adanya
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages, values: body });
		}

		return { success: true };
	}
};
