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
		rugi: 'bg-red-50 text-red-700 border-red-300',
		tipis: 'bg-yellow-50 text-yellow-800 border-yellow-300',
		aman: 'bg-green-50 text-green-700 border-green-300'
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

	// Langkah yang tampil di alur (batal ditampilkan terpisah)
	const steps = ['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai'];
	const stepName: Record<string, string> = {
		draft: 'Draft',
		penawaran: 'Penawaran',
		deal: 'Deal',
		dikerjakan: 'Dikerjakan',
		selesai: 'Selesai'
	};

	let ev = $derived(data.summary.evaluation);
	let next = $derived(transitions[data.order.status] ?? []);
	let stepIdx = $derived(steps.indexOf(data.order.status));

	// Harga kesepakatan (dipakai saat status jadi deal) dan harga untuk simulasi
	// Nilai awal diambil dari data saat halaman dibuka (disengaja)
	// svelte-ignore state_referenced_locally
	let finalPrice = $state(Number(data.order.offeredPrice) || 0);
	// svelte-ignore state_referenced_locally
	let simPrice = $state(Number(data.price) || 0);

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let savingSchedule = $state(false);

	// Kolom yang belum ada di tipe Order
	type Extra = {
		startDate: string | null;
		dueDate: string | null;
		finalPrice?: number | string | null;
		customer?: { name?: string; phone?: string | null } | null;
	};
	let ex = $derived(data.order as unknown as Extra);

	// Harga yang dipakai di kartu: harga kesepakatan kalau ada, kalau tidak harga penawaran
	let price = $derived(Number(ex.finalPrice) || Number(data.order.offeredPrice) || 0);
	let cost = $derived(Number(data.summary.cost.total) || 0);
	let profit = $derived(price - cost);
	let margin = $derived(price > 0 ? Math.round((profit / price) * 1000) / 10 : 0);
	let profitCls = $derived(
		price === 0 ? 'text-gray-500' : profit < 0 ? 'text-red-600' : margin < 15 ? 'text-yellow-700' : 'text-green-700'
	);

	// 0812-3456-7890 -> 6281234567890
	let wa = $derived.by(() => {
		const p = ex.customer?.phone;
		if (!p) return null;
		let d = p.replace(/\D/g, '');
		if (d.startsWith('0')) d = '62' + d.slice(1);
		else if (d.startsWith('8')) d = '62' + d;
		return d.length >= 9 ? d : null;
	});

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
		if (!ex.dueDate || !['deal', 'dikerjakan'].includes(data.order.status)) return null;
		const left = dayDiff(ex.dueDate);
		if (left < 0) return { text: `Terlambat ${-left} hari`, cls: 'bg-red-100 text-red-700' };
		if (left === 0) return { text: 'Jatuh tempo hari ini', cls: 'bg-amber-100 text-amber-800' };
		if (left <= 7) return { text: `${left} hari lagi`, cls: 'bg-amber-100 text-amber-800' };
		return { text: `${left} hari lagi`, cls: 'bg-gray-100 text-gray-700' };
	});

	let canSchedule = $derived(!['selesai', 'batal'].includes(data.order.status));

	const pill =
		'rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100';
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
	<a href="/orders" class="text-sm font-medium text-brand-600 hover:underline">← Semua order</a>

	<!-- Kepala -->
	<header class="mt-3 mb-5">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="text-2xl font-bold text-brand-900">{data.order.title}</h1>
			<span class="rounded-full px-3 py-1 text-sm font-semibold {badge[data.order.status]}">
				{data.order.status}
			</span>
			{#if dueLabel}
				<span class="rounded-full px-3 py-1 text-sm font-semibold {dueLabel.cls}">{dueLabel.text}</span>
			{/if}
		</div>
		<p class="mt-1 text-gray-600">
			{data.order.orderNumber} · {data.order.customer?.name}
		</p>

		<div class="mt-3 flex flex-wrap gap-2">
			{#if data.order.status === 'draft' || data.order.status === 'penawaran'}
				<a href="/orders/{data.order.id}/edit" class={pill}>Ubah order</a>
			{/if}
			{#if ['deal', 'dikerjakan', 'selesai'].includes(data.order.status)}
				<a href="/orders/{data.order.id}/pembayaran" class={pill}>Pembayaran</a>
			{/if}
			<a href="/orders/{data.order.id}/foto" class={pill}>Foto</a>
			<a href="/orders/{data.order.id}/nota" class={pill}>Cetak nota</a>
			{#if wa}
				<a
					href="https://wa.me/{wa}"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
				>
					WhatsApp pelanggan
				</a>
			{/if}
		</div>
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

	<!-- Alur status -->
	{#if data.order.status === 'batal'}
		<p class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 font-medium text-red-700">
			Order ini dibatalkan.
		</p>
	{:else}
		<ol class="mb-5 flex items-center gap-1 overflow-x-auto">
			{#each steps as s, i (s)}
				<li class="flex min-w-0 flex-1 items-center gap-1">
					<span
						class="flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm
						{i < stepIdx
							? 'bg-brand-100 text-brand-700'
							: i === stepIdx
								? 'bg-brand-600 text-white'
								: 'bg-gray-100 text-gray-400'}"
					>
						{i < stepIdx ? '✓' : i + 1}
						<span>{stepName[s]}</span>
					</span>
					{#if i < steps.length - 1}
						<span class="h-px min-w-3 flex-1 {i < stepIdx ? 'bg-brand-300' : 'bg-gray-200'}"></span>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}

	<!-- Angka utama -->
	<section class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card">
			<p class="text-xs text-gray-500">Harga jual</p>
			<p class="mt-1 text-xl font-bold text-brand-900">{rupiah(price)}</p>
		</div>
		<div class="card">
			<p class="text-xs text-gray-500">Modal</p>
			<p class="mt-1 text-xl font-bold text-brand-900">{rupiah(cost)}</p>
		</div>
		<div class="card">
			<p class="text-xs text-gray-500">{profit < 0 ? 'Rugi' : 'Untung'}</p>
			<p class="mt-1 text-xl font-bold {profitCls}">{rupiah(profit)}</p>
		</div>
		<div class="card">
			<p class="text-xs text-gray-500">Margin</p>
			<p class="mt-1 text-xl font-bold {profitCls}">{price > 0 ? `${margin}%` : '-'}</p>
		</div>
	</section>

	<div class="grid items-start gap-4 lg:grid-cols-3">
		<!-- Kolom kiri -->
		<div class="space-y-4 lg:col-span-2">
			<!-- Rincian item -->
			<section class="card overflow-x-auto p-0">
				<h2 class="p-4 pb-2 text-lg font-semibold text-brand-900">Rincian item</h2>
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
								<td class="text-right whitespace-nowrap">{Number(i.quantity)} {i.unit}</td>
								<td class="text-right whitespace-nowrap">{rupiah(i.unitPrice)}</td>
								<td class="text-right whitespace-nowrap">
									{rupiah(Number(i.quantity) * Number(i.unitPrice))}
								</td>
							</tr>
						{:else}
							<tr><td colspan="4" class="text-center text-gray-500">Belum ada item.</td></tr>
						{/each}
					</tbody>
				</table>
			</section>

			<!-- Simulator harga -->
			<section class="card">
				<h2 class="mb-1 text-lg font-semibold text-brand-900">Simulasi harga tawar</h2>
				<p class="mb-3 text-sm text-gray-500">Coba harga yang ditawar pelanggan, lihat untung atau ruginya.</p>
				<form method="GET" class="mb-3 flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1 text-sm">
						Harga yang ditawarkan
						<!-- name hanya dipasang kalau terisi, supaya kosong tidak terkirim sebagai Rp 0 -->
						<MoneyInput
							name={simPrice > 0 ? 'price' : undefined}
							bind:value={simPrice}
							placeholder="mis. 3.200.000"
							class="w-52"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						Target margin (%)
						<input
							name="targetMargin"
							type="number"
							min="0"
							max="99"
							step="1"
							value={data.targetMargin}
							placeholder="15"
							class="field w-28"
						/>
					</label>
					<button class="btn">Hitung</button>
				</form>

				{#if ev}
					<div class="mb-3 rounded-xl border p-3 {evalStyle[ev.status]}">
						<p class="text-xl font-bold uppercase">{ev.status}</p>
						<p>
							Harga {rupiah(ev.price)} → untung <strong>{rupiah(ev.profit)}</strong>
							(margin {ev.marginPercent}%)
						</p>
					</div>
				{/if}

				<div class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-xl bg-gray-50 p-3">
						<p class="text-xs text-gray-500">Titik impas (di bawah ini rugi)</p>
						<p class="font-bold">{rupiah(data.summary.breakEvenPrice)}</p>
					</div>
					<div class="rounded-xl bg-brand-100/50 p-3">
						<p class="text-xs text-gray-500">Harga minimum margin {data.summary.targetMarginPercent}%</p>
						<p class="font-bold text-brand-900">{rupiah(data.summary.recommendedMinPrice)}</p>
					</div>
				</div>
			</section>
		</div>

		<!-- Kolom kanan -->
		<div class="space-y-4">
			<!-- Ubah status -->
			<section class="card">
				<h2 class="mb-2 text-lg font-semibold text-brand-900">Ubah status</h2>
				{#if next.length === 0}
					<p class="text-gray-500">Order ini sudah di status akhir ({data.order.status}).</p>
				{:else}
					<div class="space-y-3">
						{#each next as s (s)}
							<form
								method="POST"
								action="?/status"
								class="flex flex-col gap-2"
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
										<MoneyInput name="finalPrice" required bind:value={finalPrice} class="w-full" />
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

			<!-- Jadwal -->
			<section class="card">
				<h2 class="mb-2 text-lg font-semibold text-brand-900">Jadwal pengerjaan</h2>
				{#if canSchedule}
					<form
						method="POST"
						action="?/schedule"
						class="flex flex-col gap-3"
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
							<input name="startDate" type="date" value={ex.startDate ?? ''} class="field w-full" />
						</label>
						<label class="flex flex-col gap-1 text-sm">
							Jatuh tempo
							<input name="dueDate" type="date" value={ex.dueDate ?? ''} class="field w-full" />
						</label>
						<button disabled={savingSchedule} class="btn">
							{savingSchedule ? 'Menyimpan...' : 'Simpan jadwal'}
						</button>
						<p class="text-xs text-gray-500">Kosongkan tanggal lalu simpan untuk menghapus jadwal.</p>
					</form>
				{:else}
					<dl class="space-y-1 text-sm">
						<div class="flex justify-between gap-2">
							<dt class="text-gray-500">Mulai</dt>
							<dd>{ex.startDate ? tgl(ex.startDate) : '-'}</dd>
						</div>
						<div class="flex justify-between gap-2">
							<dt class="text-gray-500">Jatuh tempo</dt>
							<dd>{ex.dueDate ? tgl(ex.dueDate) : '-'}</dd>
						</div>
					</dl>
				{/if}
			</section>

			<!-- Modal -->
			<section class="card">
				<h2 class="mb-2 text-lg font-semibold text-brand-900">Rincian modal</h2>
				<dl class="grid grid-cols-2 gap-y-1 text-sm">
					<dt class="text-gray-600">Bahan</dt>
					<dd class="text-right">{rupiah(data.summary.cost.material)}</dd>
					<dt class="text-gray-600">Upah tukang</dt>
					<dd class="text-right">{rupiah(data.summary.cost.labor)}</dd>
					<dt class="text-gray-600">Ongkir</dt>
					<dd class="text-right">{rupiah(data.summary.cost.delivery)}</dd>
					<dt class="text-gray-600">Biaya lain</dt>
					<dd class="text-right">{rupiah(data.summary.cost.other)}</dd>
					<dt class="mt-1 border-t pt-1 font-bold">Total modal</dt>
					<dd class="mt-1 border-t pt-1 text-right font-bold">{rupiah(data.summary.cost.total)}</dd>
				</dl>
			</section>
		</div>
	</div>
</main>