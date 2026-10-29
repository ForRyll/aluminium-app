<script lang="ts">
	import { rupiah } from '../../lib/api';

	let { data } = $props();

	// Warna lencana per status order
	const badge: Record<string, string> = {
		draft: 'bg-gray-200 text-gray-700',
		penawaran: 'bg-blue-100 text-blue-700',
		deal: 'bg-amber-100 text-amber-700',
		dikerjakan: 'bg-purple-100 text-purple-700',
		selesai: 'bg-green-100 text-green-700',
		batal: 'bg-red-100 text-red-700'
	};
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="page-title">Order</h1>
			<p class="text-gray-500">Semua pekerjaan, dari penawaran sampai selesai.</p>
		</div>
		<a href="/orders/new" class="btn">+ Buat order baru</a>
	</div>

	{#if data.error}
		<p class="rounded-lg bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.orders.length === 0}
		<p class="card text-gray-500">Belum ada order.</p>
	{:else}
		<div class="card overflow-x-auto p-0">
			<table class="tbl">
				<thead>
					<tr>
						<th>No. Order</th>
						<th>Pekerjaan</th>
						<th>Pelanggan</th>
						<th>Status</th>
						<th class="text-right">Harga tawar</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as o (o.id)}
						<tr>
							<td>
								<a href="/orders/{o.id}" class="font-medium text-brand-600 underline">
									{o.orderNumber}
								</a>
							</td>
							<td>{o.title}</td>
							<td>{o.customer?.name ?? '-'}</td>
							<td>
								<span class="rounded-full px-3 py-1 text-sm {badge[o.status]}">{o.status}</span>
							</td>
							<td class="text-right">{o.offeredPrice ? rupiah(o.offeredPrice) : '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>