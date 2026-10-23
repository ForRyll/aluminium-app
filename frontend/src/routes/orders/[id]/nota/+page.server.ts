import { error } from '@sveltejs/kit';
import { API_URL, type Order } from '../../../../lib/api';
import type { PageServerLoad } from './$types';

interface PaymentInfo {
	agreedPrice: number | null;
	totalPaid: number;
	remaining: number | null;
	payments: { id: string; amount: string; paidAt: string; method: string; note: string | null }[];
}

// Dijalankan di server: ambil data order dan pembayarannya untuk dicetak sebagai nota
export const load: PageServerLoad = async ({ fetch, params }) => {
	const [orderRes, payRes] = await Promise.all([
		fetch(`${API_URL}/orders/${params.id}`),
		fetch(`${API_URL}/orders/${params.id}/payments`)
	]);

	if (orderRes.status === 404) error(404, 'Order tidak ditemukan');
	if (!orderRes.ok) error(502, 'Backend tidak bisa dihubungi');

	return {
		order: (await orderRes.json()) as Order,
		// Kalau data pembayaran gagal dimuat, nota tetap tercetak tanpa bagian pembayaran
		pay: payRes.ok ? ((await payRes.json()) as PaymentInfo) : null
	};
};