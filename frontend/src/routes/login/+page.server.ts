import { fail, redirect } from '@sveltejs/kit';
import { API_URL } from '../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Kalau sudah login, tidak perlu melihat halaman login lagi
export const load: PageServerLoad = async ({ locals }) => {
    if (locals.token) redirect(303, '/');
};

export const actions: Actions = {
    default: async ({ request, fetch, cookies }) => {
        const form = await request.formData();
        const username = String(form.get('username') ?? '').trim();
        const password = String(form.get('password') ?? '');

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const message =
                res.status === 401 ? 'Username atau password salah' : 'Gagal login, coba lagi';
            // Password tidak pernah dikembalikan ke layar
            return fail(res.status === 401 ? 401 : 400, { message, username });
        }

        const { accessToken } = await res.json();

        // Cookie httpOnly: tidak bisa dibaca JavaScript di browser. Berlaku 12 jam, sama dengan token.
        cookies.set('token', accessToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 12
        });

        redirect(303, '/');
    }
};

