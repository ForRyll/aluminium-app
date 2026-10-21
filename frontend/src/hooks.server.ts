import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { API_URL } from './lib/api';

// Halaman yang boleh dibuka tanpa login
const PUBLIC_PATHS = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('token') ?? null;
    event.locals.token = token;

    const isPublic = PUBLIC_PATHS.includes(event.url.pathname);
    if (!token && !isPublic) redirect(303, '/login');

    return resolve(event);
};

// Pemanggilan ke backend dari sisi server otomatis membawa token
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    if (request.url.startsWith(API_URL) && event.locals.token) {
        request.headers.set('Authorization', `Bearer ${event.locals.token}`);
    }
    return fetch(request);
};
