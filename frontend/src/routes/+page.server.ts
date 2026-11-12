import { API_URL, type DashboardData, type UpcomingData } from '../lib/api';
import type { PageServerLoad } from './$types';

// Dijalankan di server: ambil ringkasan dan jadwal untuk Beranda
export const load: PageServerLoad = async ({ fetch }) => {
	const [res, upRes] = await Promise.all([
		fetch(`${API_URL}/dashboard`),
		fetch(`${API_URL}/schedule/upcoming`)
	]);

	if (!res.ok) {
		return {
			dash: null as DashboardData | null,
			upcoming: null as UpcomingData | null,
			error: `Backend membalas ${res.status}`
		};
	}
	return {
		dash: (await res.json()) as DashboardData,
		// Kalau jadwal gagal dimuat, Beranda tetap tampil tanpa kartu jadwal
		upcoming: upRes.ok ? ((await upRes.json()) as UpcomingData) : null,
		error: null
	};
};