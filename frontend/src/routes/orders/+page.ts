import { API_URL, type Order } from '../../lib/api';
import type { PageLoad } from './$types';

// Ambil semua order dari backend
export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/orders`);
	if (!res.ok) return { orders: [] as Order[], error: `Backend membalas ${res.status}` };
	return { orders: (await res.json()) as Order[], error: null };
};