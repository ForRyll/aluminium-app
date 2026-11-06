import { error, fail } from '@sveltejs/kit';
import { API_URL, type Order } from '../../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

interface Photo {
	id: string;
	kind: 'sebelum' | 'proses' | 'sesudah';
	caption: string | null;
	originalName: string;
	mimeType: string;
	size: number;
	createdAt: string;
}

// Dijalankan di server: ambil data order dan daftar fotonya
export const load: PageServerLoad = async ({ fetch, params }) => {
	const [orderRes, photosRes] = await Promise.all([
		fetch(`${API_URL}/orders/${params.id}`),
		fetch(`${API_URL}/orders/${params.id}/photos`)
	]);

	if (orderRes.status === 404) error(404, 'Order tidak ditemukan');
	if (!orderRes.ok || !photosRes.ok) error(502, 'Backend tidak bisa dihubungi');

	const order = (await orderRes.json()) as Order;
	const { max, photos } = (await photosRes.json()) as { max: number; photos: Photo[] };

	return {
		orderId: params.id,
		orderNumber: order.orderNumber,
		title: order.title,
		max,
		photos
	};
};

// Ambil daftar pesan error dari balasan backend
async function readErrors(res: Response): Promise<string[]> {
	const err = await res.json().catch(() => null);
	return Array.isArray(err?.message)
		? err.message
		: [err?.message ?? `Backend membalas ${res.status}`];
}

export const actions: Actions = {
	// Unggah satu foto (sudah dikecilkan di browser)
	upload: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { messages: ['Pilih foto dulu'] });
		}

		// Content-Type multipart diatur otomatis, jangan ditulis manual
		const body = new FormData();
		body.set('file', file, file.name);
		body.set('kind', String(form.get('kind') ?? 'proses'));
		const caption = String(form.get('caption') ?? '').trim();
		if (caption) body.set('caption', caption);

		const res = await fetch(`${API_URL}/orders/${params.id}/photos`, { method: 'POST', body });
		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Foto berhasil diunggah.' };
	},

	// Hapus satu foto
	remove: async ({ request, fetch, params }) => {
		const form = await request.formData();
		const photoId = String(form.get('photoId') ?? '');

		const res = await fetch(`${API_URL}/orders/${params.id}/photos/${photoId}`, {
			method: 'DELETE'
		});
		if (!res.ok) return fail(res.status, { messages: await readErrors(res) });
		return { success: true, message: 'Foto dihapus.' };
	}
};