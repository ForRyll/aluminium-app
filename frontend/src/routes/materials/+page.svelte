<script lang="ts">
	import { rupiah } from '../../lib/api';

		let { data, form } = $props();
</script>

<main class="mx-auto max-w-4xl p-6">
	<h1 class="mb-4 text-2xl font-bold">Katalog Material</h1>
	<!-- Form tambah material -->
	<details class="mb-6 rounded border p-4" open={!!form?.messages}>
		<summary class="cursor-pointer font-semibold">+ Tambah material</summary>

		{#if form?.messages}
			<ul class="mt-3 rounded bg-red-100 p-3 text-red-700">
				{#each form.messages as m}
					<li>{m}</li>
				{/each}
			</ul>
		{/if}
		{#if form?.success}
			<p class="mt-3 rounded bg-green-100 p-3 text-green-700">Material berhasil ditambahkan.</p>
		{/if}

		<form method="POST" action="?/create" class="mt-3 grid gap-3 sm:grid-cols-2">
			<input name="name" placeholder="Nama (mis. Profil kusen 4 inci)" required
				value={form?.values?.name ?? ''} class="rounded border px-3 py-2" />
			<input name="category" placeholder="Kategori (profil, kaca, aksesoris)" required
				value={form?.values?.category ?? ''} class="rounded border px-3 py-2" />
			<input name="brand" placeholder="Merk (opsional)"
				value={form?.values?.brand ?? ''} class="rounded border px-3 py-2" />
			<input name="unit" placeholder="Satuan (batang, m2, pcs)" required
				value={form?.values?.unit ?? ''} class="rounded border px-3 py-2" />
			<input name="price" type="number" min="0" step="0.01" placeholder="Harga per satuan" required
				value={form?.values?.price ?? ''} class="rounded border px-3 py-2" />
			<input name="lengthPerUnit" type="number" min="0" step="0.01" placeholder="Panjang 1 batang (meter, opsional)"
				value={form?.values?.lengthPerUnit ?? ''} class="rounded border px-3 py-2" />
			<button class="rounded bg-orange-500 px-4 py-2 font-semibold text-white sm:col-span-2">
				Simpan material
			</button>
		</form>
	</details>
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

