import { fail, redirect } from '@sveltejs/kit';
import { API_URL } from '../../../lib/api';
import type { Actions } from './$types';

interface ItemInput {
	mode: 'catalog' | 'free';
	materialId: string;
	description: string;
	unit: string;
	quantity: number | string;
	unitPrice: number | string;
}

// Kolom angka kosong dikirim sebagai undefined (nanti dianggap 0 oleh backend)
const num = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').trim();
	return s === '' ? undefined : Number(s);
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData();

		// Daftar item dikirim dari layar dalam bentuk JSON
		let rawItems: ItemInput[] = [];
		try {
			rawItems = JSON.parse(String(form.get('items') ?? '[]'));
		} catch {
			rawItems = [];
		}

		// Item katalog cukup materialId + jumlah, harga disalin backend dari katalog
		const items = rawItems.map((i) =>
			i.mode === 'catalog'
				? { materialId: i.materialId || undefined, quantity: Number(i.quantity) }
				: {
						description: String(i.description ?? '').trim(),
						unit: String(i.unit ?? '').trim(),
						unitPrice: Number(i.unitPrice),
						quantity: Number(i.quantity)
					}
		);

		const body = {
			customerId: String(form.get('customerId') ?? ''),
			title: String(form.get('title') ?? '').trim(),
			items,
			laborCost: num(form.get('laborCost')),
			deliveryCost: num(form.get('deliveryCost')),
			otherCost: num(form.get('otherCost')),
			offeredPrice: num(form.get('offeredPrice')),
			notes: String(form.get('notes') ?? '').trim() || undefined
		};

		const res = await fetch(`${API_URL}/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			// Backend mengirim daftar pesan validasi, tampilkan apa adanya
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages });
		}

		// Berhasil: langsung buka halaman detail order yang baru dibuat
		const created = await res.json();
		redirect(303, `/orders/${created.id}`);
	}
};