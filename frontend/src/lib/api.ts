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