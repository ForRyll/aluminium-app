<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../../lib/api';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);

	// Tanggal hari ini (YYYY-MM-DD) sebagai isian awal
	const today = new Date().toLocaleDateString('en-CA');

	let info = $derived(data.info);
	let lunas = $derived(info.remaining !== null && info.remaining <= 0);

	const tanggal = (d: string) =>
		new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<main class="mx-auto max-w-3xl p-6">
	<a href="/orders/{data.orderId}" class="text-sm text-brand-600 underline">← Kembali ke order</a>
	<h1 class="mt-2 mb-1 text-2xl font-bold">Pembayaran {info.orderNumber}</h1>
	<p class="mb-4 text-gray-600">Status order: <strong>{info.status}</strong></p>

	{#if form?.messages}
		<ul class="mb-4 rounded bg-red-100 p-3 text-red-700">
			{#each form.messages as m}
				<li>{m}</li>
			{/each}
		</ul>
	{/if}
	{#if form?.success}
		<p class="mb-4 rounded bg-green-100 p-3 text-green-700">{form.message}</p>
	{/if}

	<!-- Ringkasan -->
	<dl class="mb-6 grid max-w-md grid-cols-2 gap-y-1">
		<dt>Harga kesepakatan</dt>
		<dd class="text-right">{info.agreedPrice !== null ? rupiah(info.agreedPrice) : '-'}</dd>
		<dt>Sudah dibayar</dt>
		<dd class="text-right">{rupiah(info.totalPaid)}</dd>
		<dt class="border-t pt-1 font-bold">Sisa tagihan</dt>
		<dd class="border-t pt-1 text-right font-bold">
			{info.remaining !== null ? rupiah(info.remaining) : '-'}
		</dd>
	</dl>

	{#if lunas}
		<p class="mb-6 rounded border border-green-300 bg-green-100 p-3 font-semibold text-green-700">
			LUNAS
		</p>
	{/if}

	<!-- Form catat pembayaran -->
	{#if ['deal', 'dikerjakan', 'selesai'].includes(info.status) && !lunas}
		<h2 class="mb-2 text-lg font-semibold">Catat pembayaran</h2>
		<form
			method="POST"
			action="?/add"
			class="mb-8 grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="flex flex-col text-sm">
				Jumlah (Rp)
				<input name="amount" type="number" min="1" step="1000" required
					max={info.remaining ?? undefined} class="rounded border px-3 py-2" />
			</label>
			<label class="flex flex-col text-sm">
				Tanggal diterima
				<input name="paidAt" type="date" value={today} required class="rounded border px-3 py-2" />
			</label>
			<label class="flex flex-col text-sm">
				Cara bayar
				<select name="method" class="rounded border px-3 py-2">
					<option value="tunai">Tunai</option>
					<option value="transfer">Transfer</option>
					<option value="lainnya">Lainnya</option>
				</select>
			</label>
			<label class="flex flex-col text-sm">
				Keterangan (opsional)
				<input name="note" placeholder="mis. DP 50%" class="rounded border px-3 py-2" />
			</label>
			<button
				disabled={submitting}
				class="rounded bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2"
			>
				{submitting ? 'Menyimpan...' : 'Simpan pembayaran'}
			</button>
		</form>
	{:else if !lunas}
		<p class="mb-8 rounded bg-yellow-100 p-3 text-yellow-800">
			Pembayaran baru bisa dicatat setelah order berstatus deal.
		</p>
	{/if}

	<!-- Riwayat -->
	<h2 class="mb-2 text-lg font-semibold">Riwayat pembayaran</h2>
	{#if info.payments.length === 0}
		<p class="text-gray-500">Belum ada pembayaran.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b bg-gray-100">
						<th class="p-2">Tanggal</th>
						<th class="p-2">Cara</th>
						<th class="p-2">Keterangan</th>
						<th class="p-2 text-right">Jumlah</th>
						<th class="p-2"></th>
					</tr>
				</thead>
				<tbody>
					{#each info.payments as p (p.id)}
						<tr class="border-b">
							<td class="p-2">{tanggal(p.paidAt)}</td>
							<td class="p-2">{p.method}</td>
							<td class="p-2">{p.note ?? '-'}</td>
							<td class="p-2 text-right">{rupiah(p.amount)}</td>
							<td class="p-2">
								<form
									method="POST"
									action="?/remove"
									use:enhance={({ cancel }) => {
										if (!confirm('Hapus pembayaran ini?')) cancel();
									}}
								>
									<input type="hidden" name="paymentId" value={p.id} />
									<button class="rounded border border-red-400 px-3 py-1 text-sm text-red-600">
										Hapus
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>