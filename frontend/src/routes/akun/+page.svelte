<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let busy = $state(false);
</script>

<main class="mx-auto max-w-xl p-4 md:p-6">
	<div class="mb-4">
		<h1 class="page-title">Akun</h1>
		<p class="text-gray-500">Ganti password untuk masuk ke aplikasi ini.</p>
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

	<form
		method="POST"
		class="card grid gap-3"
		use:enhance={() => {
			busy = true;
			return async ({ result, update }) => {
				// Berhasil: kosongkan semua kolom. Gagal: biarkan, supaya tidak mengetik ulang.
				await update({ reset: result.type === 'success' });
				busy = false;
			};
		}}
	>
		<label class="flex flex-col gap-1 text-sm">
			Password saat ini
			<input name="currentPassword" type="password" required autocomplete="current-password" class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Password baru (minimal 8 karakter)
			<input name="newPassword" type="password" required minlength="8" autocomplete="new-password" class="field" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Ulangi password baru
			<input name="confirmPassword" type="password" required minlength="8" autocomplete="new-password" class="field" />
		</label>
		<button disabled={busy} class="btn">
			{busy ? 'Menyimpan...' : 'Ganti password'}
		</button>
	</form>

	<section class="card mt-4 text-sm text-gray-600">
		<ul class="list-disc space-y-1 pl-5">
			<li>Setelah password diganti, <strong>perangkat atau browser lain otomatis keluar</strong> dan harus login ulang.</li>
			<li>Pakai password yang panjang dan unik, dan simpan di password manager atau catatan yang aman. Password tidak bisa dilihat lagi setelah disimpan.</li>
			<li>Kalau suatu saat lupa password, aplikasi ini belum punya fitur lupa password. Pemulihannya lewat skrip di komputer ini.</li>
		</ul>
	</section>
</main>