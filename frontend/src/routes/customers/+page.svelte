<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<div class="mb-4">
		<h1 class="page-title">Pelanggan</h1>
		<p class="text-gray-500">Klik nama pelanggan untuk mengubah datanya.</p>
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

	<!-- Form tambah pelanggan -->
	<details class="card mb-4" open={!!form?.values}>
		<summary class="cursor-pointer font-semibold text-brand-700">+ Tambah pelanggan</summary>

		<form
			method="POST"
			action="?/create"
			class="mt-4 grid gap-3 sm:grid-cols-2"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input name="name" placeholder="Nama pelanggan" required
				value={form?.values?.name ?? ''} class="field" />
			<input name="phone" placeholder="No. HP (mis. 0812-3456-7890)"
				value={form?.values?.phone ?? ''} class="field" />
			<input name="address" placeholder="Alamat pengerjaan (opsional)"
				value={form?.values?.address ?? ''} class="field sm:col-span-2" />
			<input name="notes" placeholder="Catatan (mis. langganan, minta kaca riben)"
				value={form?.values?.notes ?? ''} class="field sm:col-span-2" />
			<button disabled={submitting} class="btn sm:col-span-2">
				{submitting ? 'Menyimpan...' : 'Simpan pelanggan'}
			</button>
		</form>
	</details>

	<!-- Pencarian: nama atau nomor HP -->
	<form method="GET" class="mb-4 flex gap-2">
		<input name="search" value={data.search} placeholder="Cari nama atau nomor HP..." class="field" />
		<button class="btn">Cari</button>
	</form>

	{#if data.error}
		<p class="rounded-lg bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if data.customers.length === 0}
		<p class="card text-gray-500">Belum ada pelanggan.</p>
	{:else}
		<div class="card overflow-x-auto p-0">
			<table class="tbl">
				<thead>
					<tr>
						<th>Nama</th>
						<th>No. HP</th>
						<th>Alamat</th>
						<th>Catatan</th>
					</tr>
				</thead>
				<tbody>
					{#each data.customers as c (c.id)}
						<tr>
							<td class="font-medium">
								<a href="/customers/{c.id}" class="text-brand-600 underline">{c.name}</a>
							</td>
							<td>{c.phone ?? '-'}</td>
							<td>{c.address ?? '-'}</td>
							<td>{c.notes ?? '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>