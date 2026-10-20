import { API_URL, type Customer } from '../../lib/api';
import type { PageLoad } from './$types';

// Dijalankan sebelum halaman tampil: ambil daftar pelanggan dari backend
export const load: PageLoad = async ({ fetch, url }) => {
	const search = url.searchParams.get('search') ?? '';
	const res = await fetch(`${API_URL}/customers?search=${encodeURIComponent(search)}`);

	if (!res.ok) {
		return { customers: [] as Customer[], search, error: `Backend membalas ${res.status}` };
	}
	return { customers: (await res.json()) as Customer[], search, error: null };
};