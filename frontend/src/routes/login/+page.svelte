<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let show = $state(false);

	const points = [
		'Kalkulator ukuran otomatis untuk jendela dan pintu',
		'Untung, rugi, dan margin tiap order langsung terlihat',
		'Pembayaran, foto pekerjaan, dan nota tersimpan rapi'
	];
</script>

<div class="min-h-screen bg-brand-600 lg:grid lg:grid-cols-[1.1fr_1fr] lg:bg-white">
	<!-- Sisi kiri (layar lebar) -->
	<aside
		class="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between"
	>
		<!-- Gelembung dekoratif -->
		<span class="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-white/10"></span>
		<span class="pointer-events-none absolute top-1/3 -left-24 h-64 w-64 rounded-full bg-white/10"></span>
		<span class="pointer-events-none absolute -right-10 -bottom-24 h-80 w-80 rounded-full bg-white/10"></span>
		<span class="pointer-events-none absolute right-24 bottom-40 h-10 w-10 rounded-full bg-white/20"></span>

		<div class="relative w-fit rounded-2xl bg-white p-3 shadow-lg">
			<img src="/logo.png" alt="Nazril Aluminium" class="h-14 w-auto" />
		</div>

		<div class="relative max-w-md">
			<h2 class="mb-6 text-4xl leading-tight font-bold">Hitung harga, catat order, tahu untungnya.</h2>
			<ul class="grid gap-3">
				{#each points as p}
					<li class="flex items-start gap-3 text-brand-100">
						<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 text-sm text-white">✓</span>
						{p}
					</li>
				{/each}
			</ul>
		</div>

		<p class="relative text-sm text-brand-200">Nazril Aluminium</p>
	</aside>

	<!-- Form -->
	<div class="flex min-h-screen items-center justify-center p-4">
		<main class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl sm:p-8 lg:shadow-none">
			<img src="/logo.png" alt="Nazril Aluminium" class="mx-auto mb-4 h-20 w-auto lg:hidden" />
			<h1 class="page-title text-center lg:text-left">Selamat datang</h1>
			<p class="mb-6 text-center text-gray-500 lg:text-left">Masuk untuk melanjutkan ke aplikasi.</p>

			{#if form?.message}
				<p
					role="alert"
					class="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
				>
					<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
						/>
					</svg>
					{form.message}
				</p>
			{/if}

			<form
				method="POST"
				class="grid gap-4"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
					Username
					<!-- svelte-ignore a11y_autofocus -->
					<input
						name="username"
						required
						autofocus
						autocomplete="username"
						value={form?.username ?? ''}
						class="field text-base"
					/>
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
					Password
					<span class="relative block">
						<input
							name="password"
							type={show ? 'text' : 'password'}
							required
							autocomplete="current-password"
							class="field pr-16 text-base"
						/>
						<button
							type="button"
							onclick={() => (show = !show)}
							class="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
							aria-label={show ? 'Sembunyikan password' : 'Lihat password'}
						>
							{show ? 'Sembunyi' : 'Lihat'}
						</button>
					</span>
				</label>

				<button disabled={submitting} class="btn mt-1 py-3 text-base">
					{#if submitting}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
						</svg>
						Masuk...
					{:else}
						Masuk
					{/if}
				</button>
			</form>

			<p class="mt-6 text-center text-xs text-gray-400 lg:text-left">
				Hanya untuk pengguna yang berwenang.
			</p>
		</main>
	</div>
</div>