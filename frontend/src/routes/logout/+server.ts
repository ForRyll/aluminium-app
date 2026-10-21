import { redirect, type RequestHandler } from '@sveltejs/kit';

// Hapus cookie login, lalu kembali ke halaman masuk
export const POST: RequestHandler = async ({ cookies }) => {
    cookies.delete('token', { path: '/' });
    redirect(303, '/login');
};
