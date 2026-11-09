import { error } from '@sveltejs/kit';
import { API_URL } from '../../../lib/api';
import type { RequestHandler } from './$types';

// Hanya lima nama ini yang boleh diunduh
const ALLOWED = ['orders.csv', 'payments.csv', 'customers.csv', 'materials.csv', 'backup.json'];

// Meneruskan file ekspor dari backend ke browser. Karena lewat server ini, file hanya bisa
// diunduh setelah login (token ditempelkan otomatis oleh hooks.server.ts).
export const GET: RequestHandler = async ({ fetch, params, cookies }) => {
	if (!ALLOWED.includes(params.name)) error(404, 'File ekspor tidak dikenal');

	const res = await fetch(`${API_URL}/export/${params.name}`);
	if (!res.ok) error(res.status === 404 ? 404 : 502, 'Gagal mengambil data ekspor');

	// Catat kapan backup terakhir diunduh (dipakai untuk pengingat)
	if (params.name === 'backup.json') {
		cookies.set('lastBackup', new Date().toISOString(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	return new Response(res.body, {
		headers: {
			'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
			'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};