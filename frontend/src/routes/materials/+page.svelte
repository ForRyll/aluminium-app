<script lang="ts">
	import { rupiah } from '#lib/api';

	let { data } = $props();
</script>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-4 text-2xl font-bold">Katalog Material</h1>

	<!-- Pencarian: kirim ?search=... ke halaman yang sama -->
	<form method="GET" class="mb-4 flex gap-2">
		<input
			name="search"
			value={data.search}
			placeholder="Cari nama material..."
			class="w-full rounded border px-3 py-2"
		/>
		<button class="rounded bg-orange-500 px-4 py-2 font-semibold text-white">Cari</button>
	</form>

	{#if data.error}
		<p class="rounded bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.materials.length === 0}
		<p class="text-gray-500">Belum ada material.</p>
	{:else}
		<table class="w-full border-collapse text-left">
			<thead>
				<tr class="border-b bg-gray-100">
					<th class="p-2">Nama</th>
					<th class="p-2">Kategori</th>
					<th class="p-2">Merk</th>
					<th class="p-2">Satuan</th>
					<th class="p-2 text-right">Harga</th>
				</tr>
			</thead>
			<tbody>
				{#each data.materials as m (m.id)}
					<tr class="border-b">
						<td class="p-2">{m.name}</td>
						<td class="p-2">{m.category}</td>
						<td class="p-2">{m.brand ?? '-'}</td>
						<td class="p-2">{m.unit}</td>
						<td class="p-2 text-right">{rupiah(m.price)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</main>
