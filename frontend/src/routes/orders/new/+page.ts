import { API_URL, type Customer, type Material } from '../../../lib/api';
import type { PageLoad } from './$types';

// Ambil daftar pelanggan dan material untuk pilihan di form
export const load: PageLoad = async ({ fetch }) => {
	const [cRes, mRes] = await Promise.all([
		fetch(`${API_URL}/customers`),
		fetch(`${API_URL}/materials`)
	]);

	if (!cRes.ok || !mRes.ok) {
		return {
			customers: [] as Customer[],
			materials: [] as Material[],
			error: 'Backend tidak bisa dihubungi'
		};
	}
	return {
		customers: (await cRes.json()) as Customer[],
		materials: (await mRes.json()) as Material[],
		error: null
	};
};