<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-5xl p-6">
	<h1 class="mb-4 text-2xl font-bold">Pelanggan</h1>

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

	<!-- Form tambah pelanggan -->
	<details class="mb-6 rounded border p-4" open={!!form?.values}>
		<summary class="cursor-pointer font-semibold">+ Tambah pelanggan</summary>

		<form
			method="POST"
			action="?/create"
			class="mt-3 grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input name="name" placeholder="Nama pelanggan" required
				value={form?.values?.name ?? ''} class="rounded border px-3 py-2" />
			<input name="phone" placeholder="No. HP (mis. 0812-3456-7890)"
				value={form?.values?.phone ?? ''} class="rounded border px-3 py-2" />
			<input name="address" placeholder="Alamat pengerjaan (opsional)"
				value={form?.values?.address ?? ''} class="rounded border px-3 py-2 sm:col-span-2" />
			<input name="notes" placeholder="Catatan (mis. langganan, minta kaca riben)"
				value={form?.values?.notes ?? ''} class="rounded border px-3 py-2 sm:col-span-2" />
			<button
				disabled={submitting}
				class="rounded bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2"
			>
				{submitting ? 'Menyimpan...' : 'Simpan pelanggan'}
			</button>
		</form>
	</details>

	<!-- Pencarian: nama atau nomor HP -->
	<form method="GET" class="mb-4 flex gap-2">
		<input name="search" value={data.search} placeholder="Cari nama atau nomor HP..."
			class="w-full rounded border px-3 py-2" />
		<button class="rounded bg-orange-500 px-4 py-2 font-semibold text-white">Cari</button>
	</form>

	{#if data.error}
		<p class="rounded bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.customers.length === 0}
		<p class="text-gray-500">Belum ada pelanggan.</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b bg-gray-100">
						<th class="p-2">Nama</th>
						<th class="p-2">No. HP</th>
						<th class="p-2">Alamat</th>
						<th class="p-2">Catatan</th>
					</tr>
				</thead>
				<tbody>
					{#each data.customers as c (c.id)}
						<tr class="border-b">
							<td class="p-2 font-medium">{c.name}</td>
							<td class="p-2">{c.phone ?? '-'}</td>
							<td class="p-2">{c.address ?? '-'}</td>
							<td class="p-2">{c.notes ?? '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>