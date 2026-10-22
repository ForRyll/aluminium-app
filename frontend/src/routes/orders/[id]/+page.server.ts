import { error, fail } from '@sveltejs/kit';
import { API_URL, type Order, type OrderSummary } from '../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Dijalankan di server: ambil detail order dan ringkasan keuangannya.
// ?price= dan ?targetMargin= dipakai untuk simulasi tawar-menawar.
export const load: PageServerLoad = async ({ fetch, params, url, locals }) => {
	const price = url.searchParams.get('price')?.trim() ?? '';
	const targetMargin = url.searchParams.get('targetMargin')?.trim() ?? '';

	// Parameter kosong tidak dikirim, karena backend menolak string kosong
	const query = new URLSearchParams();
	if (price) query.set('price', price);
	if (targetMargin) query.set('targetMargin', targetMargin);

	const [orderRes, summaryRes] = await Promise.all([
		fetch(`${API_URL}/orders/${params.id}`),
		fetch(`${API_URL}/orders/${params.id}/summary?${query}`)
	]);

	if (orderRes.status === 404) error(404, 'Order tidak ditemukan');
		if (!orderRes.ok || !summaryRes.ok) {
		// Sementara: catat status asli dari backend untuk melacak 502
		console.log('DETAIL ORDER GAGAL ->', {
			orderStatus: orderRes.status,
			summaryStatus: summaryRes.status,
			hasToken: !!locals.token,
			path: url.pathname
		});
		error(502, 'Backend tidak bisa dihubungi');
	}
	return {
		order: (await orderRes.json()) as Order,
		summary: (await summaryRes.json()) as OrderSummary,
		price,
		targetMargin
	};
};

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