<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../lib/api';
	import MoneyInput from '../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	// Harga di form tambah, dan penanda form sedang dikirim (mencegah kiriman ganda)
	let newPrice = $state(0);
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="page-title">Katalog Material</h1>
			<p class="text-gray-500">Harga di sini dipakai saat membuat order baru.</p>
		</div>
		<a href="/materials/harga-massal" class="btn-outline">Ubah harga massal</a>
	</div>

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

	<!-- Form tambah material -->
	<details class="card mb-4" open={!!form?.messages}>
		<summary class="cursor-pointer font-semibold text-brand-700">+ Tambah material</summary>

		<form
			method="POST"
			action="?/create"
			class="mt-4 grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') newPrice = 0;
					submitting = false;
				};
			}}
		>
			<input name="name" placeholder="Nama (mis. Profil kusen 4 inci)" required class="field" />
			<input name="category" placeholder="Kategori (profil, kaca, aksesoris)" required class="field" />
			<input name="brand" placeholder="Merk (opsional)" class="field" />
			<input name="unit" placeholder="Satuan (batang, m2, pcs)" required class="field" />
			<MoneyInput name="price" bind:value={newPrice} placeholder="Harga per satuan" required />
			<input name="lengthPerUnit" type="number" min="0" step="0.01"
				placeholder="Panjang 1 batang (meter, opsional)" class="field" />
			<button disabled={submitting} class="btn sm:col-span-2">
				{submitting ? 'Menyimpan...' : 'Simpan material'}
			</button>
		</form>
	</details>

	<!-- Pencarian: kirim ?search=... ke halaman yang sama -->
	<form method="GET" class="mb-4 flex gap-2">
		<input name="search" value={data.search} placeholder="Cari nama material..." class="field" />
		<button class="btn">Cari</button>
	</form>

	{#if data.error}
		<p class="rounded-lg bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.materials.length === 0}
		<p class="card text-gray-500">Belum ada material.</p>
	{:else}
		<div class="card overflow-x-auto p-0">
			<table class="tbl">
				<thead>
					<tr>
						<th>Nama</th>
						<th>Kategori</th>
						<th>Merk</th>
						<th>Satuan</th>
						<th class="text-right">Harga</th>
						<th>Ubah harga</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<!-- Kunci memuat harga, supaya kolom "Harga baru" ikut kosong setelah disimpan -->
					{#each data.materials as m (m.id + m.price)}
						<tr>
							<td class="font-medium">{m.name}</td>
							<td>{m.category}</td>
							<td>{m.brand ?? '-'}</td>
							<td>{m.unit}</td>
							<td class="text-right">{rupiah(m.price)}</td>
							<td>
								<form method="POST" action="?/update" use:enhance class="flex items-center gap-2">
									<input type="hidden" name="id" value={m.id} />
									<MoneyInput name="price" required placeholder="Harga baru" class="w-44" />
									<button class="btn-outline">Simpan</button>
								</form>
							</td>
							<td>
								<form
									method="POST"
									action="?/deactivate"
									use:enhance={({ cancel }) => {
										if (!confirm('Nonaktifkan material ini? Riwayat order lama tetap aman.')) cancel();
									}}
								>
									<input type="hidden" name="id" value={m.id} />
									<button class="btn-danger">Nonaktifkan</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>