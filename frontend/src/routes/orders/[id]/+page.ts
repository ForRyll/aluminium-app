import { error } from '@sveltejs/kit';
import { API_URL, type Order, type OrderSummary } from '../../../lib/api';
import type { PageLoad } from './$types';

// Ambil detail order dan ringkasan keuangannya.
// ?price= dan ?targetMargin= dipakai untuk simulasi tawar-menawar.
export const load: PageLoad = async ({ fetch, params, url }) => {
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
	if (!orderRes.ok || !summaryRes.ok) error(502, 'Backend tidak bisa dihubungi');

	return {
		order: (await orderRes.json()) as Order,
		summary: (await summaryRes.json()) as OrderSummary,
		price,
		targetMargin
	};
};