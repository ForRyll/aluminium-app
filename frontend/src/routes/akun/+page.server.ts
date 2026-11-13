import { fail } from '@sveltejs/kit';
import { API_URL } from '../../lib/api';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const form = await request.formData();
		const currentPassword = String(form.get('currentPassword') ?? '');
		const newPassword = String(form.get('newPassword') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		// Password tidak pernah dikembalikan ke layar, jadi hanya pesan yang dikirim balik
		if (newPassword.length < 8) {
			return fail(400, { messages: ['Password baru minimal 8 karakter'] });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { messages: ['Pengulangan password baru tidak sama'] });
		}

		const res = await fetch(`${API_URL}/auth/change-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword })
		});

		if (!res.ok) {
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages });
		}

		// Sesi yang sedang dipakai diperbarui dengan token baru. Sesi lain otomatis keluar.
		const { accessToken } = await res.json();
		cookies.set('token', accessToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 12
		});

		return { success: true, message: 'Password berhasil diganti. Sesi di perangkat lain sudah keluar.' };
	}
};