import { error, fail, redirect } from '@sveltejs/kit';
import { API_URL, type Material, type Order, type OrderItem } from '../../../../lib/api';
import type { Actions, PageServerLoad } from './$types';

// Bentuk order lengkap dari backend (termasuk biaya dan material tiap item)
// Bentuk order lengkap dari backend (termasuk biaya dan material tiap item)
type FullOrder = Omit<Order, 'items'> & {
	laborCost: string;
	deliveryCost: string;
	otherCost: string;
	notes: string | null;
	items: (OrderItem & { material: Material | null })[];
};

// Hanya order dengan status ini yang boleh diubah
const EDITABLE = ['draft', 'penawaran'];

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [orderRes, mRes] = await Promise.all([
		fetch(`${API_URL}/orders/${params.id}`),
		fetch(`${API_URL}/materials`)
	]);

	if (orderRes.status === 404) error(404, 'Order tidak ditemukan');
	if (!orderRes.ok || !mRes.ok) error(502, 'Backend tidak bisa dihubungi');

	const order = (await orderRes.json()) as FullOrder;

	// Order yang sudah deal tidak boleh diubah, kembalikan ke halaman detail
	if (!EDITABLE.includes(order.status)) redirect(303, `/orders/${params.id}`);

	// Material yang sudah dinonaktifkan tetap muncul di pilihan kalau masih dipakai order ini
	const materials = (await mRes.json()) as Material[];
	const known = new Set(materials.map((m) => m.id));
	for (const i of order.items) {
		if (i.material && !known.has(i.material.id)) {
			materials.push(i.material);
			known.add(i.material.id);
		}
	}

	return {
		orderId: order.id,
		orderNumber: order.orderNumber,
		customerName: order.customer?.name ?? '-',
		title: order.title,
		laborCost: Number(order.laborCost),
		deliveryCost: Number(order.deliveryCost),
		otherCost: Number(order.otherCost),
		offeredPrice: order.offeredPrice ? Number(order.offeredPrice) : 0,
		notes: order.notes ?? '',
		materials,
		items: order.items.map((i) => ({
			mode: (i.material ? 'catalog' : 'free') as 'catalog' | 'free',
			materialId: i.material?.id ?? '',
			description: i.description,
			unit: i.unit,
			quantity: Number(i.quantity),
			unitPrice: Number(i.unitPrice)
		}))
	};
};

interface ItemInput {
	mode: 'catalog' | 'free';
	materialId: string;
	description: string;
	unit: string;
	quantity: number | string;
	unitPrice: number | string;
}

// Kolom angka kosong dikirim sebagai undefined (artinya tidak diubah)
const num = (v: FormDataEntryValue | null) => {
	const s = String(v ?? '').trim();
	return s === '' ? undefined : Number(s);
};

export const actions: Actions = {
	default: async ({ request, fetch, params }) => {
		const form = await request.formData();

		// Daftar item dikirim dari layar dalam bentuk JSON
		let rawItems: ItemInput[] = [];
		try {
			rawItems = JSON.parse(String(form.get('items') ?? '[]'));
		} catch {
			rawItems = [];
		}

		// Harga satuan selalu ikut dikirim, supaya harga lama tidak berubah sendiri
		const items = rawItems.map((i) => ({
			materialId: i.mode === 'catalog' ? i.materialId || undefined : undefined,
			description: String(i.description ?? '').trim() || undefined,
			unit: String(i.unit ?? '').trim() || undefined,
			quantity: Number(i.quantity),
			unitPrice: i.unitPrice === '' ? undefined : Number(i.unitPrice)
		}));

		const body = {
			title: String(form.get('title') ?? '').trim(),
			items,
			laborCost: num(form.get('laborCost')),
			deliveryCost: num(form.get('deliveryCost')),
			otherCost: num(form.get('otherCost')),
			offeredPrice: num(form.get('offeredPrice')),
			notes: String(form.get('notes') ?? '').trim()
		};

		const res = await fetch(`${API_URL}/orders/${params.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			// Backend mengirim alasan penolakan, tampilkan apa adanya
			const err = await res.json().catch(() => null);
			const messages: string[] = Array.isArray(err?.message)
				? err.message
				: [err?.message ?? `Backend membalas ${res.status}`];
			return fail(res.status, { messages });
		}

		// Berhasil: kembali ke halaman detail order
		redirect(303, `/orders/${params.id}`);
	}
};