import { error, fail } from '@sveltejs/kit';
import { API_URL } from '../../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

interface Payment {
	id: string;
	amount: string;
	paidAt: string;
	method: string;
	note: string | null;
}

interface PaymentInfo {
	orderNumber: string;
	status: string;
	agreedPrice: number | null;
	totalPaid: number;
	remaining: number | null;
	payments: Payment[];
}

// Dijalankan di server: ambil daftar pembayaran beserta sisa tagihan
export const load: PageServerLoad = async ({ fetch, params }) => {
	const res = await fetch(`${API_URL}/orders/${params.id}/payments`);
	if (res.status === 404) error(404, 'Order tidak ditemukan');
	if (!res.ok) error(502, 'Backend tidak bisa dihubungi');
	return { orderId: params.id, info: (await res.json()) as PaymentInfo };
};

// Ambil daftar pesan error dari balasan backend
async function readErrors(res: Response): Promise<string[]> {
	const err = await res.json().catch(() => null);
	return Array.isArray(err?.message)
		? err.message
		: [err?.message ?? `Backend membalas ${res.status}`];
}

export const actions: Actions = {
	// Catat pembayaran baru (DP, cicilan, atau pelunasan)
	add: async ({ request, fetch, params }) => {
		const form = await request.formData();

		const body = {
			amount: Number(form.get('amount')),
			paidAt: String(form.get('paidAt') ?? '') || undefined,
			method: String(form.get('method') ?? 'tunai'),
			note: String(form.get('note') ?? '').trim() || undefined
		};

		const res = await fetch(`${API_URL}/orders/${params.id}/payments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Pembayaran dicatat.' };
	},

	// Hapus satu pembayaran (untuk memperbaiki salah catat)
	remove: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const paymentId = String(form.get('paymentId') ?? '');

		const res = await fetch(`${API_URL}/orders/${params.id}/payments/${paymentId}`, {
			method: 'DELETE'
		});

		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Pembayaran dihapus.' };
	}
};