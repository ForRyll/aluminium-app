<script lang="ts">
	interface Props {
		value?: number;
		name?: string;
		id?: string;
		placeholder?: string;
		required?: boolean;
		max?: number;
		class?: string;
	}

	// class dipakai untuk mengatur lebar pembungkus (mis. "w-40"), bukan gaya kotaknya
	let {
		value = $bindable(0),
		name,
		id,
		placeholder = '0',
		required = false,
		max,
		class: className = ''
	}: Props = $props();

	// 1250000 jadi "1.250.000". Nol ditampilkan kosong supaya placeholder terlihat.
	const format = (n: number) => (n > 0 ? new Intl.NumberFormat('id-ID').format(n) : '');

	let text = $derived(format(value));

	function onInput(e: Event & { currentTarget: HTMLInputElement }) {
		const el = e.currentTarget;
		const caret = el.selectionStart ?? el.value.length;

		// Jumlah digit di kiri kursor sebelum diformat ulang
		const digitsLeft = el.value.slice(0, caret).replace(/\D/g, '').length;

		// Ambil hanya angka (maksimal 12 digit)
		let n = Number(el.value.replace(/\D/g, '').slice(0, 12) || 0);
		if (max !== undefined && n > max) n = max;
		value = n;

		const formatted = format(n);
		el.value = formatted;

		// Kembalikan kursor ke posisi digit yang sama, supaya mengedit di tengah angka tidak melompat
		let pos = 0;
		let seen = 0;
		while (pos < formatted.length && seen < digitsLeft) {
			if (/\d/.test(formatted[pos])) seen++;
			pos++;
		}
		el.setSelectionRange(pos, pos);
	}
</script>

<div class="relative {className}">
	<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">
		Rp
	</span>
	<input
		{id}
		type="text"
		inputmode="numeric"
		autocomplete="off"
		{placeholder}
		{required}
		value={text}
		oninput={onInput}
		class="field pl-9 text-right"
	/>
	<!-- Nilai asli (angka polos) yang dikirim ke server -->
	{#if name}
		<input type="hidden" {name} value={value} />
	{/if}
</div>