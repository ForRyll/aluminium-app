<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-2xl p-4 md:p-6">
	<a href="/customers" class="text-sm text-brand-600 underline">← Semua pelanggan</a>
	<h1 class="page-title mt-2 mb-4">Ubah pelanggan</h1>

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
		action="?/update"
		class="card grid gap-3"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<label class="flex flex-col gap-1 text-sm">
			Nama
			<input name="name" required value={data.customer.name} class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			No. HP
			<input name="phone" value={data.customer.phone ?? ''} class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Alamat
			<input name="address" value={data.customer.address ?? ''} class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Catatan
			<input name="notes" value={data.customer.notes ?? ''} class="field" />
		</label>
		<button disabled={submitting} class="btn">
			{submitting ? 'Menyimpan...' : 'Simpan perubahan'}
		</button>
	</form>

	<!-- Hapus pelanggan -->
	<form
		method="POST"
		action="?/remove"
		class="mt-8 border-t pt-4"
		use:enhance={({ cancel }) => {
			if (!confirm('Hapus pelanggan ini? Tindakan ini tidak bisa dibalikkan.')) cancel();
		}}
	>
		<button class="btn-danger">Hapus pelanggan</button>
		<p class="mt-1 text-sm text-gray-500">
			Pelanggan yang sudah punya order tidak bisa dihapus.
		</p>
	</form>
</main>