import { API_URL } from '../../lib/api';
import type { PageServerLoad } from './$types';

interface OrderRow {
	id: string;
	orderNumber: string;
	title: string;
	customerName: string;
	status: string;
	offeredPrice: number | null;
	dueDate: string | null;
	paid: number;
	remaining: number | null;
}

interface OrderListData {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
	items: OrderRow[];
}

const STATUSES = ['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai', 'batal'];

// Dijalankan di server: ambil daftar order sesuai pencarian dan filter di alamat
export const load: PageServerLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const rawStatus = url.searchParams.get('status') ?? '';
	const status = STATUSES.includes(rawStatus) ? rawStatus : '';
	const unpaid = url.searchParams.get('unpaid') === '1';
	const page = Math.min(10000, Math.max(1, Math.floor(Number(url.searchParams.get('page'))) || 1));

	// Hanya kirim parameter yang terisi, karena backend menolak nilai kosong
	const query = new URLSearchParams();
	if (q) query.set('q', q);
	if (status) query.set('status', status);
	if (unpaid) query.set('unpaid', '1');
	if (page > 1) query.set('page', String(page));

	const filters = { q, status, unpaid };

	const res = await fetch(`${API_URL}/order-list?${query}`);
	if (!res.ok) {
		return { list: null as OrderListData | null, filters, error: `Backend membalas ${res.status}` };
	}
	return { list: (await res.json()) as OrderListData, filters, error: null };
};