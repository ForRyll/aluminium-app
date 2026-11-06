// Ubah nomor HP Indonesia ke format internasional tanpa tanda baca, contoh: 0877-4290 jadi 62877...
export function waNumber(phone: string | null | undefined): string | null {
	if (!phone) return null;
	let d = phone.replace(/\D/g, '');
	if (d.startsWith('0')) d = '62' + d.slice(1);
	else if (d.startsWith('8')) d = '62' + d;
	// Nomor yang terlalu pendek dianggap tidak valid
	return d.length >= 10 ? d : null;
}

// Alamat wa.me dengan pesan yang sudah terisi. Null kalau nomornya tidak valid.
export function waLink(phone: string | null | undefined, text: string): string | null {
	const n = waNumber(phone);
	return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}