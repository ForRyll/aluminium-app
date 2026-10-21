<script lang="ts">
	import { rupiah } from '../../../lib/api';

	let { data } = $props();

	// Warna hasil evaluasi: rugi merah, tipis kuning, aman hijau
	const evalStyle: Record<string, string> = {
		rugi: 'bg-red-100 text-red-700 border-red-300',
		tipis: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		aman: 'bg-green-100 text-green-700 border-green-300'
	};

	let ev = $derived(data.summary.evaluation);
</script>

<main class="mx-auto max-w-4xl p-6">
	<a href="/orders" class="text-sm text-orange-600 underline">← Semua order</a>

	<h1 class="mt-2 text-2xl font-bold">{data.order.title}</h1>
	<p class="mb-6 text-gray-600">
		{data.order.orderNumber} · {data.order.customer?.name} · status
		<strong>{data.order.status}</strong>
	</p>

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