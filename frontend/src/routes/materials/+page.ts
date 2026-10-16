import { API_URL, type Material } from '../../lib/api';
import type { PageLoad } from './$types';

// Dijalankan sebelum halaman tampil: ambil daftar material dari backend
export const load: PageLoad = async ({ fetch, url }) => {
	const search = url.searchParams.get('search') ?? '';
	const res = await fetch(`${API_URL}/materials?search=${encodeURIComponent(search)}`);

	if (!res.ok) {
		return { materials: [] as Material[], search, error: `Backend membalas ${res.status}` };
	}
	return { materials: (await res.json()) as Material[], search, error: null };
};

