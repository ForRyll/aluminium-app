import { API_URL, type DashboardData } from '../lib/api';
import type { PageServerLoad } from './$types';

// Dijalankan di server: ambil ringkasan untuk Beranda
export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/dashboard`);
	if (!res.ok) {
		return { dash: null as DashboardData | null, error: `Backend membalas ${res.status}` };
	}
	return { dash: (await res.json()) as DashboardData, error: null };
};