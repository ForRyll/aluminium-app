<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-brand-600 p-4">
	<main class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
		<img src="/logo.png" alt="Nazril Aluminium" class="mx-auto mb-4 h-24 w-auto" />
		<h1 class="page-title text-center">Masuk</h1>
		<p class="mb-5 text-center text-gray-500">Aplikasi Estimasi dan Order Aluminium</p>

		{#if form?.message}
			<p class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{form.message}</p>
		{/if}

		<form
			method="POST"
			class="grid gap-3"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<label class="flex flex-col gap-1 text-sm">
				Username
				<input name="username" required autocomplete="username" value={form?.username ?? ''}
					class="field" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Password
				<input name="password" type="password" required autocomplete="current-password"
					class="field" />
			</label>
			<button disabled={submitting} class="btn py-3">
				{submitting ? 'Masuk...' : 'Masuk'}
			</button>
		</form>
	</main>
</div>