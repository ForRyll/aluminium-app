<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<main class="mx-auto max-w-2xl p-6">
	<a href="/customers" class="text-sm text-orange-600 underline">← Semua pelanggan</a>
	<h1 class="mt-2 mb-4 text-2xl font-bold">Ubah pelanggan</h1>

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

	<form
		method="POST"
		action="?/update"
		class="grid gap-3"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<label class="flex flex-col text-sm">
			Nama
			<input name="name" required value={data.customer.name} class="rounded border px-3 py-2" />
		</label>
		<label class="flex flex-col text-sm">
			No. HP
			<input name="phone" value={data.customer.phone ?? ''} class="rounded border px-3 py-2" />
		</label>
		<label class="flex flex-col text-sm">
			Alamat
			<input name="address" value={data.customer.address ?? ''} class="rounded border px-3 py-2" />
		</label>
		<label class="flex flex-col text-sm">
			Catatan
			<input name="notes" value={data.customer.notes ?? ''} class="rounded border px-3 py-2" />
		</label>
		<button
			disabled={submitting}
			class="rounded bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
		>
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
		<button class="rounded border border-red-400 px-4 py-2 text-red-600">Hapus pelanggan</button>
		<p class="mt-1 text-sm text-gray-500">
			Pelanggan yang sudah punya order tidak bisa dihapus.
		</p>
	</form>
</main>