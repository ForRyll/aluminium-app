<script lang="ts">
	import { enhance } from '$app/forms';
	import MoneyInput from '../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	// Nilai awal diambil dari data saat halaman dibuka (disengaja)
	// svelte-ignore state_referenced_locally
	let price = $state(Number(data.material.price) || 0);

	// true selama form dikirim, mencegah kiriman ganda
	let saving = $state(false);
</script>

<main class="mx-auto max-w-2xl p-4 md:p-6">
	<a href="/materials" class="text-sm text-brand-600 underline">← Katalog material</a>
	<h1 class="page-title mt-2">Ubah material</h1>
	<p class="mb-4 text-gray-600">
		{data.material.name}
		{#if !data.material.isActive}
			<span class="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">nonaktif</span>
		{/if}
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

	<form
		method="POST"
		action="?/save"
		class="card grid gap-3"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<label class="flex flex-col gap-1 text-sm">
			Nama
			<input name="name" required value={data.material.name} class="field" />
		</label>
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="flex flex-col gap-1 text-sm">
				Kategori
				<input name="category" required value={data.material.category} class="field" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Merk (kosongkan untuk menghapus)
				<input name="brand" value={data.material.brand ?? ''} class="field" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Satuan
				<input name="unit" required value={data.material.unit} class="field" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Harga per satuan
				<MoneyInput name="price" bind:value={price} required />
			</label>
		</div>
		<label class="flex flex-col gap-1 text-sm">
			Panjang 1 batang (meter, opsional)
			<input name="lengthPerUnit" type="number" min="0" step="0.01"
				value={data.material.lengthPerUnit ? Number(data.material.lengthPerUnit) : ''} class="field" />
		</label>
		<button disabled={saving} class="btn">
			{saving ? 'Menyimpan...' : 'Simpan perubahan'}
		</button>
		<p class="text-sm text-gray-500">
			Order yang sudah dibuat tidak ikut berubah, karena nama, satuan, dan harganya sudah disalin saat
			order dibuat.
		</p>
	</form>

	<!-- Aktifkan atau nonaktifkan -->
	<form
		method="POST"
		action="?/toggle"
		class="mt-8 border-t pt-4"
		use:enhance={({ cancel }) => {
			if (data.material.isActive && !confirm('Nonaktifkan material ini? Riwayat order lama tetap aman.')) {
				cancel();
			}
		}}
	>
		<input type="hidden" name="active" value={data.material.isActive ? 'false' : 'true'} />
		{#if data.material.isActive}
			<button class="btn-danger">Nonaktifkan material</button>
			<p class="mt-1 text-sm text-gray-500">
				Material nonaktif tidak muncul di pilihan order baru, tapi riwayat order lama tetap utuh.
			</p>
		{:else}
			<button class="btn">Aktifkan kembali</button>
			<p class="mt-1 text-sm text-gray-500">Material akan muncul lagi di pilihan order baru.</p>
		{/if}
	</form>
</main>