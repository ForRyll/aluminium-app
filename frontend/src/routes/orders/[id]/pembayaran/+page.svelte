<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../../lib/api';
	import { waLink } from '../../../../lib/whatsapp';
	import MoneyInput from '../../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	// Nama usaha di awal pesan WhatsApp. Ubah sesuai kebutuhan.
	const usaha = 'Nazril Aluminium';

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let amount = $state(0);

	// Tanggal hari ini (YYYY-MM-DD) sebagai isian awal
	const today = new Date().toLocaleDateString('en-CA');

	// Warna lencana per status order
	const badge: Record<string, string> = {
		draft: 'bg-gray-200 text-gray-700',
		penawaran: 'bg-blue-100 text-blue-700',
		deal: 'bg-amber-100 text-amber-700',
		dikerjakan: 'bg-purple-100 text-purple-700',
		selesai: 'bg-green-100 text-green-700',
		batal: 'bg-red-100 text-red-700'
	};

	const methods = [
		{ v: 'tunai', l: 'Tunai' },
		{ v: 'transfer', l: 'Transfer' },
		{ v: 'lainnya', l: 'Lainnya' }
	];

	let info = $derived(data.info);
	let lunas = $derived(info.remaining !== null && info.remaining <= 0);

	// Persen yang sudah dibayar dari harga kesepakatan
	let percent = $derived(
		info.agreedPrice && info.agreedPrice > 0
			? Math.min(100, Math.round((info.totalPaid / info.agreedPrice) * 100))
			: 0
	);

	// Isi jumlah dengan sebagian dari harga kesepakatan, tidak melebihi sisa tagihan
	function fillPercent(p: number) {
		if (!info.agreedPrice || info.remaining === null) return;
		amount = Math.min(Math.round((info.agreedPrice * p) / 100 / 1000) * 1000, info.remaining);
	}
	function fillRemaining() {
		if (info.remaining !== null && info.remaining > 0) amount = info.remaining;
	}

	// Pesan pengingat tagihan, hanya dibuat kalau masih ada sisa
	let waHref = $derived.by(() => {
		if (info.remaining === null || info.remaining <= 0 || info.agreedPrice === null) return null;
		const sapaan = data.customerName ? `Halo ${data.customerName}` : 'Halo';
		const pesan =
			`${sapaan}, kami dari ${usaha}.\n` +
			`Mengingatkan pembayaran untuk pekerjaan "${data.title}" (${info.orderNumber}).\n\n` +
			`Total: ${rupiah(info.agreedPrice)}\n` +
			`Sudah dibayar: ${rupiah(info.totalPaid)}\n` +
			`Sisa tagihan: ${rupiah(info.remaining)}\n\n` +
			`Terima kasih.`;
		return waLink(data.customerPhone, pesan);
	});

	const tanggal = (d: string) =>
		new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

	const chip =
		'rounded-full border border-brand-300 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-40';
</script>

<main class="mx-auto max-w-4xl p-4 md:p-6">
	<a href="/orders/{data.orderId}" class="text-sm font-medium text-brand-600 hover:underline">
		← Kembali ke order
	</a>

	<header class="mt-2 mb-4">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="page-title">Pembayaran</h1>
			<span class="rounded-full px-3 py-1 text-sm font-semibold {badge[info.status]}">{info.status}</span>
		</div>
		<p class="text-gray-600">{info.orderNumber} · {data.title}{data.customerName ? ` · ${data.customerName}` : ''}</p>
	</header>

	{#if form?.messages}
		<ul class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
			{#each form.messages as m}
				<li>{m}</li>
			{/each}
		</ul>
	{/if}
	{#if form?.success}
		<p class="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">{form.message}</p>
	{/if}

	<!-- Angka utama + progres -->
	<section class="card mb-4">
		<div class="grid gap-3 sm:grid-cols-3">
			<div>
				<p class="text-xs text-gray-500">Harga kesepakatan</p>
				<p class="text-lg font-bold text-brand-900">
					{info.agreedPrice !== null ? rupiah(info.agreedPrice) : '-'}
				</p>
			</div>
			<div>
				<p class="text-xs text-gray-500">Sudah dibayar</p>
				<p class="text-lg font-bold text-brand-900">{rupiah(info.totalPaid)}</p>
			</div>
			<div>
				<p class="text-xs text-gray-500">Sisa tagihan</p>
				<p class="text-lg font-bold {lunas ? 'text-green-600' : 'text-brand-800'}">
					{info.remaining !== null ? rupiah(info.remaining) : '-'}
				</p>
			</div>
		</div>

		{#if info.agreedPrice !== null}
			<div class="mt-4">
				<div class="mb-1 flex justify-between text-xs text-gray-500">
					<span>Terbayar</span>
					<span class="font-semibold {lunas ? 'text-green-600' : 'text-brand-700'}">{percent}%</span>
				</div>
				<div class="h-3 overflow-hidden rounded-full bg-brand-100">
					<div
						class="h-full rounded-full transition-all duration-500 {lunas ? 'bg-green-500' : 'bg-brand-500'}"
						style="width: {percent}%"
					></div>
				</div>
			</div>
		{/if}

		{#if lunas}
			<p class="mt-4 rounded-xl border border-green-300 bg-green-50 p-3 text-center font-bold text-green-700">
				✓ LUNAS
			</p>
		{/if}
	</section>

	<div class="grid items-start gap-4 lg:grid-cols-2">
		<!-- Kiri: catat pembayaran + pengingat -->
		<div class="grid gap-4">
			{#if ['deal', 'dikerjakan', 'selesai'].includes(info.status) && !lunas}
				<section class="card">
					<h2 class="mb-3 text-lg font-semibold text-brand-900">Catat pembayaran</h2>
					<form
						method="POST"
						action="?/add"
						class="grid gap-3"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								await update();
								if (result.type === 'success') amount = 0;
								submitting = false;
							};
						}}
					>
						<div class="grid gap-2">
							<label class="flex flex-col gap-1 text-sm">
								Jumlah
								<MoneyInput name="amount" required max={info.remaining ?? undefined} bind:value={amount} />
							</label>
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="text-xs text-gray-500">Isi cepat:</span>
								<button type="button" class={chip} onclick={() => fillPercent(30)}>DP 30%</button>
								<button type="button" class={chip} onclick={() => fillPercent(50)}>DP 50%</button>
								<button type="button" class={chip} onclick={fillRemaining}>Lunasi sisa</button>
							</div>
						</div>

						<label class="flex flex-col gap-1 text-sm">
							Tanggal diterima
							<input name="paidAt" type="date" value={today} required class="field" />
						</label>

						<div class="grid gap-1 text-sm">
							Cara bayar
							<div class="flex flex-wrap gap-2">
								{#each methods as m (m.v)}
									<label class="cursor-pointer">
										<input type="radio" name="method" value={m.v} checked={m.v === 'tunai'} class="peer sr-only" />
										<span
											class="block rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
										>
											{m.l}
										</span>
									</label>
								{/each}
							</div>
						</div>

						<label class="flex flex-col gap-1 text-sm">
							Keterangan (opsional)
							<input name="note" placeholder="mis. DP 50%" class="field" />
						</label>

						<button disabled={submitting} class="btn">
							{submitting ? 'Menyimpan...' : 'Simpan pembayaran'}
						</button>
					</form>
				</section>
			{:else if !lunas}
				<p class="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
					Pembayaran baru bisa dicatat setelah order berstatus deal.
				</p>
			{/if}

			<!-- Pengingat tagihan lewat WhatsApp -->
			{#if !lunas && info.remaining !== null && info.remaining > 0}
				<section class="card">
					<h2 class="mb-1 text-lg font-semibold text-brand-900">Pengingat tagihan</h2>
					{#if waHref}
						<p class="mb-3 text-sm text-gray-500">
							WhatsApp terbuka dengan pesan siap kirim ke {data.customerName || 'pelanggan'}. Kamu tinggal
							menekan kirim.
						</p>
						<a
							href={waHref}
							target="_blank"
							rel="noopener"
							class="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700"
						>
							Kirim lewat WhatsApp
						</a>
					{:else}
						<p class="text-sm text-gray-500">
							Nomor HP pelanggan belum valid, jadi tombol WhatsApp belum bisa dipakai. Perbaiki di menu Pelanggan.
						</p>
					{/if}
				</section>
			{/if}
		</div>

		<!-- Kanan: riwayat -->
		<section class="card">
			<div class="mb-3 flex items-center gap-2">
				<h2 class="text-lg font-semibold text-brand-900">Riwayat pembayaran</h2>
				<span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
					{info.payments.length}
				</span>
			</div>

			{#if info.payments.length === 0}
				<p class="rounded-xl border border-dashed border-brand-300 p-4 text-center text-sm text-gray-500">
					Belum ada pembayaran.
				</p>
			{:else}
				<ul class="divide-y divide-gray-100">
					{#each info.payments as p (p.id)}
						<li class="flex items-center gap-3 py-3">
							<div class="min-w-0 flex-1">
								<p class="font-semibold text-brand-900">{rupiah(p.amount)}</p>
								<p class="text-xs text-gray-500">
									{tanggal(p.paidAt)} ·
									<span class="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{p.method}</span>
								</p>
								{#if p.note}<p class="mt-0.5 truncate text-sm text-gray-600">{p.note}</p>{/if}
							</div>
							<form
								method="POST"
								action="?/remove"
								use:enhance={({ cancel }) => {
									if (!confirm('Hapus pembayaran ini?')) cancel();
								}}
							>
								<input type="hidden" name="paymentId" value={p.id} />
								<button class="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Hapus</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</main>