<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let localError = $state('');

	const kinds = [
		{ key: 'sebelum', label: 'Sebelum', long: 'Sebelum dikerjakan', cls: 'bg-amber-100 text-amber-800' },
		{ key: 'proses', label: 'Sedang', long: 'Sedang dikerjakan', cls: 'bg-purple-100 text-purple-700' },
		{ key: 'sesudah', label: 'Setelah', long: 'Setelah selesai', cls: 'bg-green-100 text-green-700' }
	] as const;
	const kindOf = (key: string) => kinds.find((k) => k.key === key) ?? kinds[1];

	type Photo = (typeof data.photos)[number];

	let full = $derived(data.photos.length >= data.max);
	let usedPercent = $derived(Math.min(100, Math.round((data.photos.length / data.max) * 100)));

	// Filter galeri
	let filter = $state<'semua' | 'sebelum' | 'proses' | 'sesudah'>('semua');
	let shown = $derived(filter === 'semua' ? data.photos : data.photos.filter((p) => p.kind === filter));
	const countOf = (key: string) => data.photos.filter((p) => p.kind === key).length;

	// Foto yang sedang dibuka besar
	let view = $state<Photo | null>(null);

	// Pratinjau foto yang dipilih
	let fileInput = $state<HTMLInputElement>();
	let preview = $state('');
	let fileName = $state('');
	let dragging = $state(false);

	function setPreview(file: File | undefined) {
		if (preview) URL.revokeObjectURL(preview);
		preview = file ? URL.createObjectURL(file) : '';
		fileName = file?.name ?? '';
	}
	function onPick() {
		setPreview(fileInput?.files?.[0]);
	}
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (f && fileInput) {
			const dt = new DataTransfer();
			dt.items.add(f);
			fileInput.files = dt.files;
			setPreview(f);
		}
	}

	const kb = (n: number) => `${Math.round(n / 1024)} KB`;

	// Kecilkan foto di browser: sisi terpanjang 1600 px, format JPEG
	async function compress(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
		const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
		const w = Math.round(bitmap.width * scale);
		const h = Math.round(bitmap.height * scale);

		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d')!;
		// Latar putih, supaya PNG transparan tidak jadi hitam
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, w, h);
		ctx.drawImage(bitmap, 0, 0, w, h);
		bitmap.close();

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', quality)
		);
		if (!blob) throw new Error('gagal');

		// Kalau hasilnya tidak lebih kecil dan formatnya sudah didukung, pakai aslinya
		if (blob.size >= file.size && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
		return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
	}

	const pill = (on: boolean) =>
		`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
			on
				? 'border-brand-600 bg-brand-600 text-white'
				: 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'
		}`;
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (view = null)} />

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<a href="/orders/{data.orderId}" class="text-sm font-medium text-brand-600 hover:underline">
		← Kembali ke order
	</a>
	<header class="mt-2 mb-4">
		<h1 class="page-title">Foto order</h1>
		<p class="text-gray-600">{data.orderNumber} · {data.title}</p>
	</header>

	{#if localError}
		<p class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{localError}</p>
	{/if}
	{#if form?.messages}
		<ul class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
			{#each form.messages as m}
				<li>{m}</li>
			{/each}
		</ul>
	{/if}
	{#if form?.success}
		<p class="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">{form.message}</p>
	{/if}

	<!-- Unggah foto -->
	<section class="card mb-5">
		<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-lg font-semibold text-brand-900">Tambah foto</h2>
			<div class="flex items-center gap-2 text-sm text-gray-600">
				<div class="h-2 w-28 overflow-hidden rounded-full bg-brand-100">
					<div
						class="h-full rounded-full {full ? 'bg-amber-500' : 'bg-brand-500'}"
						style="width: {usedPercent}%"
					></div>
				</div>
				{data.photos.length} dari {data.max}
			</div>
		</div>

		{#if full}
			<p class="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
				Foto sudah penuh. Hapus foto lama kalau mau menambah yang baru.
			</p>
		{:else}
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				class="grid gap-4 md:grid-cols-2"
				use:enhance={async ({ formData, cancel }) => {
					localError = '';
					const f = formData.get('file');
					if (f instanceof File && f.size > 0) {
						try {
							formData.set('file', await compress(f));
						} catch {
							localError = 'Foto ini tidak bisa dibaca browser. Coba foto berformat JPEG atau PNG.';
							cancel();
							return;
						}
					}
					submitting = true;
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') setPreview(undefined);
						submitting = false;
					};
				}}
			>
				<!-- Pilih foto -->
				<label
					class="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed p-3 text-center transition {dragging
						? 'border-brand-500 bg-brand-50'
						: 'border-brand-300 hover:bg-brand-50/60'}"
					ondragover={(e) => {
						e.preventDefault();
						dragging = true;
					}}
					ondragleave={() => (dragging = false)}
					ondrop={onDrop}
				>
					{#if preview}
						<img src={preview} alt="Pratinjau" class="max-h-44 rounded-lg object-contain" />
						<span class="max-w-full truncate text-xs text-gray-500">{fileName} · klik untuk ganti</span>
					{:else}
						<svg class="h-10 w-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
							/>
						</svg>
						<span class="font-medium text-brand-700">Pilih foto atau tarik ke sini</span>
						<span class="text-xs text-gray-500">Otomatis dikecilkan sebelum diunggah</span>
					{/if}
					<input
						bind:this={fileInput}
						onchange={onPick}
						name="file"
						type="file"
						accept="image/*"
						required
						class="sr-only"
					/>
				</label>

				<!-- Tahap dan keterangan -->
				<div class="grid content-start gap-3">
					<div class="grid gap-1 text-sm">
						Tahap
						<div class="flex flex-wrap gap-2">
							{#each kinds as k (k.key)}
								<label class="cursor-pointer">
									<input type="radio" name="kind" value={k.key} checked={k.key === 'proses'} class="peer sr-only" />
									<span
										class="block rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 transition peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300"
									>
										{k.long}
									</span>
								</label>
							{/each}
						</div>
					</div>
					<label class="flex flex-col gap-1 text-sm">
						Keterangan (opsional)
						<input name="caption" maxlength="200" placeholder="mis. Rangka kusen terpasang" class="field" />
					</label>
					<button disabled={submitting} class="btn">
						{submitting ? 'Mengunggah...' : 'Unggah foto'}
					</button>
				</div>
			</form>
		{/if}
	</section>

	<!-- Filter galeri -->
	<div class="mb-3 flex flex-wrap gap-2">
		<button type="button" class={pill(filter === 'semua')} onclick={() => (filter = 'semua')}>
			Semua <span class="text-xs opacity-80">{data.photos.length}</span>
		</button>
		{#each kinds as k (k.key)}
			<button type="button" class={pill(filter === k.key)} onclick={() => (filter = k.key)}>
				{k.long} <span class="text-xs opacity-80">{countOf(k.key)}</span>
			</button>
		{/each}
	</div>

	<!-- Galeri -->
	{#if shown.length === 0}
		<p class="rounded-xl border border-dashed border-brand-300 p-8 text-center text-gray-500">
			{data.photos.length === 0 ? 'Belum ada foto untuk order ini.' : 'Belum ada foto di tahap ini.'}
		</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
			{#each shown as p (p.id)}
				<figure class="card overflow-hidden p-0">
					<button type="button" class="relative block w-full" onclick={() => (view = p)}>
						<img
							src="/orders/{data.orderId}/foto/{p.id}"
							alt={p.caption ?? p.originalName}
							loading="lazy"
							class="aspect-[4/3] w-full object-cover transition hover:opacity-90"
						/>
						<span class="absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-semibold {kindOf(p.kind).cls}">
							{kindOf(p.kind).label}
						</span>
					</button>
					<figcaption class="p-3 text-sm">
						<p class="truncate text-gray-700">{p.caption ?? p.originalName}</p>
						<p class="text-xs text-gray-400">{kb(p.size)}</p>
					</figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</main>

<!-- Tampilan besar -->
{#if view}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && (view = null)}
		onkeydown={(e) => e.key === 'Escape' && (view = null)}
	>
		<img
			src="/orders/{data.orderId}/foto/{view.id}"
			alt={view.caption ?? view.originalName}
			class="max-h-[75vh] max-w-full rounded-xl object-contain"
		/>
		<div class="flex flex-wrap items-center justify-center gap-3 text-white">
			<span class="rounded-full px-3 py-1 text-xs font-semibold {kindOf(view.kind).cls}">
				{kindOf(view.kind).long}
			</span>
			<span class="max-w-xs truncate text-sm">{view.caption ?? view.originalName}</span>
		</div>
		<div class="flex flex-wrap items-center justify-center gap-2">
			<a
				href="/orders/{data.orderId}/foto/{view.id}?download=1"
				class="rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
			>
				Unduh
			</a>
			<form
				method="POST"
				action="?/remove"
				use:enhance={({ cancel }) => {
					if (!confirm('Hapus foto ini?')) {
						cancel();
						return;
					}
					return async ({ update }) => {
						await update();
						view = null;
					};
				}}
			>
				<input type="hidden" name="photoId" value={view.id} />
				<button class="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700">
					Hapus
				</button>
			</form>
			<button
				type="button"
				onclick={() => (view = null)}
				class="rounded-full border border-white/60 px-5 py-2 text-sm font-medium text-white hover:bg-white/10"
			>
				Tutup
			</button>
		</div>
	</div>
{/if}