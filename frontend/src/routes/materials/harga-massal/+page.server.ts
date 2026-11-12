import { fail } from '@sveltejs/kit';
import { API_URL, type Material } from '../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Hasil dari backend (pratinjau atau penerapan)
interface BulkResult {
	applied: boolean;
	matched: number;
	changed: number;
	unchanged: number;
	skippedNoPrice: number;
	items: {
		id: string;
		name: string;
		brand: string | null;
		unit: string;
		oldPrice: number;
		newPrice: number;
		diff: number;
	}[];
}

// Dijalankan di server: ambil daftar kategori dan merk yang ada untuk pilihan filter
export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/materials`);
	if (!res.ok) {
		return { categories: [] as string[], brands: [] as string[], total: 0, error: `Backend membalas ${res.status}` };
	}
	const list = (await res.json()) as Material[];
	const uniq = (xs: (string | null)[]) =>
		[...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'id'));
	return {
		categories: uniq(list.map((m) => m.category)),
		brands: uniq(list.map((m) => m.brand)),
		total: list.length,
		error: null
	};
};

// Satu fungsi untuk pratinjau (apply = false) dan penerapan (apply = true)
async function call(request: Request, fetcher: typeof fetch, apply: boolean) {
	const form = await request.formData();
	const text = (k: string) => String(form.get(k) ?? '').trim();

	// Isian dikembalikan ke layar apa adanya
	const values = {
		category: text('category'),
		brand: text('brand'),
		search: text('search'),
		all: form.get('all') === 'on',
		mode: text('mode') || 'percent',
		direction: text('direction') || 'naik',
		value: text('value'),
		rounding: text('rounding') || '0'
	};

	const raw = Number(values.value.replace(',', '.'));
	if (!values.value || !isFinite(raw) || raw <= 0) {
		return fail(400, { messages: ['Isi nilai perubahan dengan angka lebih dari 0'], values });
	}

	const body = {
		category: values.category || undefined,
		brand: values.brand || undefined,
		search: values.search || undefined,
		all: values.all || undefined,
		mode: values.mode,
		value: values.direction === 'turun' ? -raw : raw,
		rounding: Number(values.rounding),
		apply
	};

	const res = await fetcher(`${API_URL}/materials/bulk-price`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		// Backend mengirim alasan penolakan, tampilkan apa adanya
		const err = await res.json().catch(() => null);
		const messages: string[] = Array.isArray(err?.message)
			? err.message
			: [err?.message ?? `Backend membalas ${res.status}`];
		return fail(res.status, { messages, values });
	}

	return { result: (await res.json()) as BulkResult, values };
}

export const actions: Actions = {
	// Hanya melihat, tidak menyimpan apa pun
	preview: ({ request, fetch }) => call(request, fetch, false),
	// Menyimpan perubahan
	apply: ({ request, fetch }) => call(request, fetch, true)
};