import { fail } from '@sveltejs/kit';
import { API_URL } from '../../../lib/api';
import type { Actions } from './$types';

export const actions: Actions = {
	// Ubah status order, dengan harga kesepakatan (opsional) saat jadi deal
	status: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const status = String(form.get('status') ?? '');
		const finalRaw = String(form.get('finalPrice') ?? '').trim();

		const body: { status: string; finalPrice?: number } = { status };
		if (finalRaw !== '') body.finalPrice = Number(finalRaw);

		const res = await fetch(`${API_URL}/orders/${params.id}/status`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			// Backend mengirim alasan penolakan, tampilkan apa adanya
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages });
		}

		return { success: true, message: `Status diubah menjadi ${status}.` };
	}
};