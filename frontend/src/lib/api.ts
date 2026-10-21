// Alamat backend. Nanti diganti saat sudah online.
export const API_URL = 'http://localhost:3000';

// Bentuk data material dari backend (angka numeric datang sebagai teks)
export interface Material {
	id: string;
	name: string;
	category: string;
	brand: string | null;
	unit: string;
	price: string;
	lengthPerUnit: string | null;
	isActive: boolean;
}

// Format angka jadi Rupiah, contoh: Rp 185.000
export function rupiah(value: string | number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(Number(value));
}
// Bentuk data pelanggan dari backend
export interface Customer {
	id: string;
	name: string;
	phone: string | null;
	address: string | null;
	notes: string | null;
}

// Satu komponen dalam order
export interface OrderItem {
	id: string;
	description: string;
	unit: string;
	quantity: string;
	unitPrice: string;
}

// Bentuk data order dari backend
export interface Order {
	id: string;
	createdAt: string;
	orderNumber: string;
	title: string;
	status: 'draft' | 'penawaran' | 'deal' | 'dikerjakan' | 'selesai' | 'batal';
	offeredPrice: string | null;
	customer: Customer;
	items?: OrderItem[];
}

// Ringkasan keuangan dari /orders/:id/summary
export interface OrderSummary {
	orderNumber: string;
	cost: { material: number; labor: number; delivery: number; other: number; total: number };
	breakEvenPrice: number;
	targetMarginPercent: number;
	recommendedMinPrice: number;
	evaluation: {
		price: number;
		profit: number;
		marginPercent: number;
		status: 'rugi' | 'tipis' | 'aman';
	} | null;
}