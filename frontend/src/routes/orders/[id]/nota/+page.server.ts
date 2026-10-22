import { error } from '@sveltejs/kit';
import { API_URL, type Order } from '../../../../lib/api';
import type { PageServerLoad } from './$types';

// Dijalankan di server: ambil data order untuk dicetak sebagai nota
export const load: PageServerLoad = async ({ fetch, params }) => {
    const res = await fetch(`${API_URL}/orders/${params.id}`);
    if (res.status === 404) error(404, 'Order tidak ditemukan');
    if (!res.ok) error(502, 'Backend tidak bisa dihubungi');
    return { order: (await res.json()) as Order };
};
