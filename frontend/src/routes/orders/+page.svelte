<script lang="ts">
	import { rupiah } from '../../lib/api';

	let { data } = $props();

	// Warna lencana per status order
	const badge: Record<string, string> = {
		draft: 'bg-gray-200 text-gray-700',
		penawaran: 'bg-blue-100 text-blue-700',
		deal: 'bg-orange-100 text-orange-700',
		dikerjakan: 'bg-purple-100 text-purple-700',
		selesai: 'bg-green-100 text-green-700',
		batal: 'bg-red-100 text-red-700'
	};
</script>

<main class="mx-auto max-w-5xl p-6">
		<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Order</h1>
		<a href="/orders/new" class="rounded bg-orange-500 px-4 py-2 font-semibold text-white">
			+ Buat order baru
		</a>
	</div>

	{#if data.error}
		<p class="rounded bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.orders.length === 0}
		<p class="text-gray-500">Belum ada order.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b bg-gray-100">
						<th class="p-2">No. Order</th>
						<th class="p-2">Pekerjaan</th>
						<th class="p-2">Pelanggan</th>
						<th class="p-2">Status</th>
						<th class="p-2 text-right">Harga tawar</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as o (o.id)}
						<tr class="border-b">
							<td class="p-2">
								<a href="/orders/{o.id}" class="font-medium text-orange-600 underline">
									{o.orderNumber}
								</a>
							</td>
							<td class="p-2">{o.title}</td>
							<td class="p-2">{o.customer?.name ?? '-'}</td>
							<td class="p-2">
								<span class="rounded px-2 py-1 text-sm {badge[o.status]}">{o.status}</span>
							</td>
							<td class="p-2 text-right">
								{o.offeredPrice ? rupiah(o.offeredPrice) : '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>