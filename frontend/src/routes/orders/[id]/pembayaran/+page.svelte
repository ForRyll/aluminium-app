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

	let info = $derived(data.info);
	let lunas = $derived(info.remaining !== null && info.remaining <= 0);

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
</script>

<main class="mx-auto max-w-3xl p-4 md:p-6">
	<a href="/orders/{data.orderId}" class="text-sm text-brand-600 underline">← Kembali ke order</a>
	<h1 class="page-title mt-2 mb-1">Pembayaran {info.orderNumber}</h1>
	<p class="mb-4 text-gray-600">
		Status order:
		<span class="rounded-full px-3 py-1 text-sm {badge[info.status]}">{info.status}</span>
	</p>

	{#if form?.messages}
		<ul class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
			{#each form.messages as m}
				<li>{m}</li>
			{/each}
		</ul>
	{/if}
	{#if form?.success}
		<p class="mb-4 rounded-lg bg-green-100 p-3 text-green-700">{form.message}</p>
	{/if}

	<!-- Ringkasan -->
	<section class="card mb-4">
		<dl class="grid max-w-md grid-cols-2 gap-y-1">
			<dt>Harga kesepakatan</dt>
			<dd class="text-right">{info.agreedPrice !== null ? rupiah(info.agreedPrice) : '-'}</dd>
			<dt>Sudah dibayar</dt>
			<dd class="text-right">{rupiah(info.totalPaid)}</dd>
			<dt class="border-t pt-1 text-lg font-bold">Sisa tagihan</dt>
			<dd class="border-t pt-1 text-right text-lg font-bold text-brand-800">
				{info.remaining !== null ? rupiah(info.remaining) : '-'}
			</dd>
		</dl>
		{#if lunas}
			<p class="mt-3 rounded-lg border border-green-300 bg-green-100 p-3 text-center font-bold text-green-700">
				LUNAS
			</p>
		{:else if info.remaining !== null && info.remaining > 0}
			<!-- Pengingat tagihan lewat WhatsApp -->
			<div class="mt-3 border-t pt-3">
				{#if waHref}
					<a href={waHref} target="_blank" rel="noopener" class="btn">Kirim pengingat lewat WhatsApp</a>
					<p class="mt-1 text-sm text-gray-500">
						WhatsApp terbuka dengan pesan siap kirim ke {data.customerName || 'pelanggan'}. Kamu tinggal menekan kirim.
					</p>
				{:else}
					<p class="text-sm text-gray-500">
						Nomor HP pelanggan belum valid, jadi tombol WhatsApp belum bisa dipakai. Perbaiki di menu Pelanggan.
					</p>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Form catat pembayaran -->
	{#if ['deal', 'dikerjakan', 'selesai'].includes(info.status) && !lunas}
		<section class="card mb-4">
			<h2 class="mb-3 text-lg font-semibold text-brand-900">Catat pembayaran</h2>
			<form
				method="POST"
				action="?/add"
				class="grid gap-3 sm:grid-cols-2"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') amount = 0;
						submitting = false;
					};
				}}
			>
				<label class="flex flex-col gap-1 text-sm">
					Jumlah
					<MoneyInput name="amount" required max={info.remaining ?? undefined} bind:value={amount} />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Tanggal diterima
					<input name="paidAt" type="date" value={today} required class="field" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Cara bayar
					<select name="method" class="field">
						<option value="tunai">Tunai</option>
						<option value="transfer">Transfer</option>
						<option value="lainnya">Lainnya</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Keterangan (opsional)
					<input name="note" placeholder="mis. DP 50%" class="field" />
				</label>
				<button disabled={submitting} class="btn sm:col-span-2">
					{submitting ? 'Menyimpan...' : 'Simpan pembayaran'}
				</button>
			</form>
		</section>
	{:else if !lunas}
		<p class="mb-4 rounded-lg bg-yellow-100 p-3 text-yellow-800">
			Pembayaran baru bisa dicatat setelah order berstatus deal.
		</p>
	{/if}

	<!-- Riwayat -->
	<section class="card overflow-x-auto p-0">
		<h2 class="p-4 pb-2 text-lg font-semibold text-brand-900">Riwayat pembayaran</h2>
		{#if info.payments.length === 0}
			<p class="p-4 pt-0 text-gray-500">Belum ada pembayaran.</p>
		{:else}
			<table class="tbl">
				<thead>
					<tr>
						<th>Tanggal</th>
						<th>Cara</th>
						<th>Keterangan</th>
						<th class="text-right">Jumlah</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each info.payments as p (p.id)}
						<tr>
							<td>{tanggal(p.paidAt)}</td>
							<td>{p.method}</td>
							<td>{p.note ?? '-'}</td>
							<td class="text-right">{rupiah(p.amount)}</td>
							<td>
								<form
									method="POST"
									action="?/remove"
									use:enhance={({ cancel }) => {
										if (!confirm('Hapus pembayaran ini?')) cancel();
									}}
								>
									<input type="hidden" name="paymentId" value={p.id} />
									<button class="btn-danger">Hapus</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</main>