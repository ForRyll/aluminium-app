import { redirect } from '@sveltejs/kit';

// Halaman utama diarahkan ke daftar order
export const load = () => {
    redirect(303, '/orders');
};
