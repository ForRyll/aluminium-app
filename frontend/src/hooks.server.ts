import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { API_URL } from './lib/api';

// Halaman yang boleh dibuka tanpa login
const PUBLIC_PATHS = ['/login'];

// Dijalankan di setiap request: cek token, alihkan ke /login kalau belum masuk
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token') ?? null;
	event.locals.token = token;

	const isPublic = PUBLIC_PATHS.includes(event.url.pathname);
	if (!token && !isPublic) redirect(303, '/login');

	return resolve(event);
};

// Setiap pemanggilan ke backend dari sisi server otomatis membawa token
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	const isApi = request.url.startsWith(API_URL);
	if (isApi && event.locals.token) {
		request.headers.set('Authorization', `Bearer ${event.locals.token}`);
	}

	const res = await fetch(request);

	// Token ditolak backend (kedaluwarsa, atau sesi dibatalkan karena password diganti):
	// hapus cookie dan arahkan ke halaman login. Percobaan login yang salah dikecualikan.
	if (isApi && event.locals.token && res.status === 401 && !request.url.includes('/auth/login')) {
		event.cookies.delete('token', { path: '/' });
		redirect(303, '/login');
	}
	return res;
};