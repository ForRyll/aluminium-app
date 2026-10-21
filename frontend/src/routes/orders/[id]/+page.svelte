<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../lib/api';

	let { data, form } = $props();

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

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-4xl p-6">
			<div class="flex items-center justify-between">
		<a href="/orders" class="text-sm text-orange-600 underline">← Semua order</a>
		<a
			href="/orders/{data.order.id}/nota"
			class="rounded border border-orange-500 px-3 py-1 text-sm font-semibold text-orange-600"
		>
			Cetak nota
		</a>
			</div>
	<h1 class="mt-2 text-2xl font-bold">{data.order.title}</h1>
	<p class="mb-6 text-gray-600">
		{data.order.orderNumber} · {data.order.customer?.name} · status
		<strong>{data.order.status}</strong>
	</p>

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

	<!-- Panel ubah status -->
	<section class="mb-6 rounded border p-4">
		<h2 class="mb-2 text-lg font-semibold">Status order</h2>
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
							<label class="flex flex-col text-sm">
								Harga kesepakatan (Rp)
								<input name="finalPrice" type="number" min="0" step="1000" required
									value={data.order.offeredPrice ? Number(data.order.offeredPrice) : ''}
									class="w-44 rounded border px-3 py-2" />
							</label>
						{/if}
						<button
							disabled={submitting}
							class="rounded px-4 py-2 font-semibold disabled:opacity-50 {s === 'batal'
								? 'border border-red-400 text-red-600'
								: 'bg-orange-500 text-white'}"
						>
							{label[s]}
						</button>
					</form>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Rincian bahan -->
	<h2 class="mb-2 text-lg font-semibold">Rincian bahan</h2>
	<div class="mb-6 overflow-x-auto">
		<table class="w-full border-collapse text-left">
			<thead>
				<tr class="border-b bg-gray-100">
					<th class="p-2">Item</th>
					<th class="p-2 text-right">Jumlah</th>
					<th class="p-2 text-right">Harga satuan</th>
					<th class="p-2 text-right">Subtotal</th>
				</tr>
			</thead>
			<tbody>
				{#each data.order.items ?? [] as i (i.id)}
					<tr class="border-b">
						<td class="p-2">{i.description}</td>
						<td class="p-2 text-right">{Number(i.quantity)} {i.unit}</td>
						<td class="p-2 text-right">{rupiah(i.unitPrice)}</td>
						<td class="p-2 text-right">{rupiah(Number(i.quantity) * Number(i.unitPrice))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Modal -->
	<h2 class="mb-2 text-lg font-semibold">Modal</h2>
	<dl class="mb-6 grid max-w-md grid-cols-2 gap-y-1">
		<dt>Bahan</dt><dd class="text-right">{rupiah(data.summary.cost.material)}</dd>
		<dt>Upah tukang</dt><dd class="text-right">{rupiah(data.summary.cost.labor)}</dd>
		<dt>Ongkir</dt><dd class="text-right">{rupiah(data.summary.cost.delivery)}</dd>
		<dt>Biaya lain</dt><dd class="text-right">{rupiah(data.summary.cost.other)}</dd>
		<dt class="border-t pt-1 font-bold">Total modal</dt>
		<dd class="border-t pt-1 text-right font-bold">{rupiah(data.summary.cost.total)}</dd>
	</dl>

	<!-- Simulator harga -->
	<h2 class="mb-2 text-lg font-semibold">Simulasi harga tawar</h2>
	<form method="GET" class="mb-4 flex flex-wrap items-end gap-3">
		<label class="flex flex-col text-sm">
			Harga yang ditawarkan (Rp)
			<input name="price" type="number" min="0" step="1000" value={data.price}
				placeholder="mis. 3200000" class="w-52 rounded border px-3 py-2" />
		</label>
		<label class="flex flex-col text-sm">
			Target margin (%)
			<input name="targetMargin" type="number" min="0" max="99" step="1"
				value={data.targetMargin} placeholder="15" class="w-28 rounded border px-3 py-2" />
		</label>
		<button class="rounded bg-orange-500 px-4 py-2 font-semibold text-white">Hitung</button>
	</form>

	{#if ev}
		<div class="mb-4 rounded border p-4 {evalStyle[ev.status]}">
			<p class="text-xl font-bold uppercase">{ev.status}</p>
			<p>Harga {rupiah(ev.price)} → untung <strong>{rupiah(ev.profit)}</strong>
				(margin {ev.marginPercent}%)</p>
		</div>
	{:else}
		<p class="mb-4 text-gray-500">Isi harga tawar untuk melihat untung-rugi.</p>
	{/if}

	<dl class="grid max-w-md grid-cols-2 gap-y-1">
		<dt>Titik impas (di bawah ini rugi)</dt>
		<dd class="text-right">{rupiah(data.summary.breakEvenPrice)}</dd>
		<dt>Harga minimum margin {data.summary.targetMarginPercent}%</dt>
		<dd class="text-right font-bold">{rupiah(data.summary.recommendedMinPrice)}</dd>
	</dl>
</main>