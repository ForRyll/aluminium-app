<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../lib/api';
	import MoneyInput from '../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	// Warna lencana per status order
	const badge: Record<string, string> = {
		draft: 'bg-gray-200 text-gray-700',
		penawaran: 'bg-blue-100 text-blue-700',
		deal: 'bg-amber-100 text-amber-700',
		dikerjakan: 'bg-purple-100 text-purple-700',
		selesai: 'bg-green-100 text-green-700',
		batal: 'bg-red-100 text-red-700'
	};

	// Warna hasil evaluasi: rugi merah, tipis kuning, aman hijau
	const evalStyle: Record<string, string> = {
		rugi: 'bg-red-100 text-red-700 border-red-300',
		tipis: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		aman: 'bg-green-100 text-green-700 border-green-300'
	};

	// Alur status yang diizinkan, sama dengan aturan di backend
	const transitions: Record<string, string[]> = {
		draft: ['penawaran', 'batal'],
		penawaran: ['draft', 'deal', 'batal'],
		deal: ['dikerjakan', 'batal'],
		dikerjakan: ['selesai', 'batal'],
		selesai: [],
		batal: []
	};

	const label: Record<string, string> = {
		draft: 'Kembali ke draft',
		penawaran: 'Jadikan penawaran',
		deal: 'Tandai deal',
		dikerjakan: 'Mulai dikerjakan',
		selesai: 'Tandai selesai',
		batal: 'Batalkan order'
	};

	let ev = $derived(data.summary.evaluation);
	let next = $derived(transitions[data.order.status] ?? []);

	// Harga kesepakatan (dipakai saat status jadi deal) dan harga untuk simulasi
	// Nilai awal diambil dari data saat halaman dibuka (disengaja)
	// svelte-ignore state_referenced_locally
	let finalPrice = $state(Number(data.order.offeredPrice) || 0);
	// svelte-ignore state_referenced_locally
	let simPrice = $state(Number(data.price) || 0);

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let savingSchedule = $state(false);

	// Jadwal pengerjaan. Kolom tanggal ada di order, tetapi belum ada di tipe Order.
	type Sched = { startDate: string | null; dueDate: string | null };
	let sched = $derived(data.order as unknown as Sched);

	const today = new Date().toLocaleDateString('en-CA');
	const dayDiff = (to: string) =>
		Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86_400_000);
	const tgl = (d: string) =>
		new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});

	// Penanda jatuh tempo hanya untuk pekerjaan yang sedang dijanjikan (deal dan dikerjakan)
	let dueLabel = $derived.by(() => {
		if (!sched.dueDate || !['deal', 'dikerjakan'].includes(data.order.status)) return null;
		const left = dayDiff(sched.dueDate);
		if (left < 0) return { text: `Terlambat ${-left} hari`, cls: 'bg-red-100 text-red-700' };
		if (left === 0) return { text: 'Jatuh tempo hari ini', cls: 'bg-amber-100 text-amber-800' };
		if (left <= 7) return { text: `${left} hari lagi`, cls: 'bg-amber-100 text-amber-800' };
		return { text: `${left} hari lagi`, cls: 'bg-gray-100 text-gray-700' };
	});

	let canSchedule = $derived(!['selesai', 'batal'].includes(data.order.status));
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<a href="/orders" class="text-sm text-brand-600 underline">← Semua order</a>
		<div class="flex flex-wrap gap-2">
			{#if data.order.status === 'draft' || data.order.status === 'penawaran'}
				<a href="/orders/{data.order.id}/edit" class="btn-outline">Ubah order</a>
			{/if}
			{#if ['deal', 'dikerjakan', 'selesai'].includes(data.order.status)}
				<a href="/orders/{data.order.id}/pembayaran" class="btn-outline">Pembayaran</a>
			{/if}
			<a href="/orders/{data.order.id}/foto" class="btn-outline">Foto</a>
			<a href="/orders/{data.order.id}/nota" class="btn-outline">Cetak nota</a>
		</div>
	</div>

	<h1 class="page-title mt-2">{data.order.title}</h1>
	<p class="mb-6 text-gray-600">
		{data.order.orderNumber} · {data.order.customer?.name} ·
		<span class="rounded-full px-3 py-1 text-sm {badge[data.order.status]}">{data.order.status}</span>
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

	<!-- Panel ubah status -->
	<section class="card mb-4">
		<h2 class="mb-2 text-lg font-semibold text-brand-900">Status order</h2>
		{#if next.length === 0}
			<p class="text-gray-500">Order ini sudah di status akhir ({data.order.status}).</p>
		{:else}
			<div class="flex flex-wrap items-end gap-4">
				{#each next as s (s)}
					<form
						method="POST"
						action="?/status"
						class="flex items-end gap-2"
						use:enhance={({ cancel }) => {
							if (s === 'batal' && !confirm('Batalkan order ini? Tindakan ini tidak bisa dibalikkan.')) {
								cancel();
								return;
							}
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="status" value={s} />
						{#if s === 'deal'}
							<label class="flex flex-col gap-1 text-sm">
								Harga kesepakatan
								<MoneyInput name="finalPrice" required bind:value={finalPrice} class="w-52" />
							</label>
						{/if}
						<button disabled={submitting} class={s === 'batal' ? 'btn-danger' : 'btn'}>
							{label[s]}
						</button>
					</form>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Jadwal pengerjaan -->
	<section class="card mb-4">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<h2 class="text-lg font-semibold text-brand-900">Jadwal pengerjaan</h2>
			{#if dueLabel}
				<span class="rounded-full px-3 py-0.5 text-sm font-semibold {dueLabel.cls}">{dueLabel.text}</span>
			{/if}
		</div>

		{#if canSchedule}
			<form
				method="POST"
				action="?/schedule"
				class="flex flex-wrap items-end gap-3"
				use:enhance={() => {
					savingSchedule = true;
					return async ({ update }) => {
						await update({ reset: false });
						savingSchedule = false;
					};
				}}
			>
				<label class="flex flex-col gap-1 text-sm">
					Mulai
					<input name="startDate" type="date" value={sched.startDate ?? ''} class="field w-44" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Jatuh tempo
					<input name="dueDate" type="date" value={sched.dueDate ?? ''} class="field w-44" />
				</label>
				<button disabled={savingSchedule} class="btn">
					{savingSchedule ? 'Menyimpan...' : 'Simpan jadwal'}
				</button>
			</form>
			<p class="mt-2 text-sm text-gray-500">Kosongkan tanggal lalu simpan untuk menghapus jadwal.</p>
		{:else}
			<p class="text-gray-600">
				Mulai: {sched.startDate ? tgl(sched.startDate) : '-'} · Jatuh tempo:
				{sched.dueDate ? tgl(sched.dueDate) : '-'}
			</p>
		{/if}
	</section>

	<!-- Rincian bahan -->
	<section class="card mb-4 overflow-x-auto p-0">
		<h2 class="p-4 pb-2 text-lg font-semibold text-brand-900">Rincian bahan</h2>
		<table class="tbl">
			<thead>
				<tr>
					<th>Item</th>
					<th class="text-right">Jumlah</th>
					<th class="text-right">Harga satuan</th>
					<th class="text-right">Subtotal</th>
				</tr>
			</thead>
			<tbody>
				{#each data.order.items ?? [] as i (i.id)}
					<tr>
						<td>{i.description}</td>
						<td class="text-right">{Number(i.quantity)} {i.unit}</td>
						<td class="text-right">{rupiah(i.unitPrice)}</td>
						<td class="text-right">{rupiah(Number(i.quantity) * Number(i.unitPrice))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<div class="grid gap-4 lg:grid-cols-2">
		<!-- Modal -->
		<section class="card">
			<h2 class="mb-2 text-lg font-semibold text-brand-900">Modal</h2>
			<dl class="grid grid-cols-2 gap-y-1">
				<dt>Bahan</dt><dd class="text-right">{rupiah(data.summary.cost.material)}</dd>
				<dt>Upah tukang</dt><dd class="text-right">{rupiah(data.summary.cost.labor)}</dd>
				<dt>Ongkir</dt><dd class="text-right">{rupiah(data.summary.cost.delivery)}</dd>
				<dt>Biaya lain</dt><dd class="text-right">{rupiah(data.summary.cost.other)}</dd>
				<dt class="border-t pt-1 font-bold">Total modal</dt>
				<dd class="border-t pt-1 text-right font-bold">{rupiah(data.summary.cost.total)}</dd>
			</dl>
		</section>

		<!-- Simulator harga -->
		<section class="card">
			<h2 class="mb-2 text-lg font-semibold text-brand-900">Simulasi harga tawar</h2>
			<form method="GET" class="mb-3 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					Harga yang ditawarkan
					<!-- name hanya dipasang kalau terisi, supaya kosong tidak terkirim sebagai Rp 0 -->
					<MoneyInput name={simPrice > 0 ? 'price' : undefined} bind:value={simPrice} placeholder="mis. 3.200.000" class="w-52" />
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Target margin (%)
					<input name="targetMargin" type="number" min="0" max="99" step="1"
						value={data.targetMargin} placeholder="15" class="field w-28" />
				</label>
				<button class="btn">Hitung</button>
			</form>

			{#if ev}
				<div class="mb-3 rounded-lg border p-3 {evalStyle[ev.status]}">
					<p class="text-xl font-bold uppercase">{ev.status}</p>
					<p>
						Harga {rupiah(ev.price)} → untung <strong>{rupiah(ev.profit)}</strong>
						(margin {ev.marginPercent}%)
					</p>
				</div>
			{:else}
				<p class="mb-3 text-gray-500">Isi harga tawar untuk melihat untung-rugi.</p>
			{/if}

			<dl class="grid grid-cols-2 gap-y-1">
				<dt>Titik impas (di bawah ini rugi)</dt>
				<dd class="text-right">{rupiah(data.summary.breakEvenPrice)}</dd>
				<dt>Harga minimum margin {data.summary.targetMarginPercent}%</dt>
				<dd class="text-right font-bold">{rupiah(data.summary.recommendedMinPrice)}</dd>
			</dl>
		</section>
	</div>
</main>