import { error } from '@sveltejs/kit';
import { API_URL } from '../../../../../lib/api';
import type { RequestHandler } from './$types';

// Meneruskan foto dari backend ke browser. Karena lewat server ini, foto hanya bisa
// dibuka setelah login (token ditempelkan otomatis oleh hooks.server.ts).
export const GET: RequestHandler = async ({ fetch, params, url }) => {
	const query = url.searchParams.get('download') === '1' ? '?download=1' : '';
	const res = await fetch(`${API_URL}/orders/${params.id}/photos/${params.photoId}/file${query}`);

	if (res.status === 404) error(404, 'Foto tidak ditemukan');
	if (!res.ok) error(502, 'Backend tidak bisa dihubungi');

	return new Response(res.body, {
		headers: {
			'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
			'Content-Disposition': res.headers.get('content-disposition') ?? 'inline',
			'Cache-Control': 'private, max-age=3600',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};