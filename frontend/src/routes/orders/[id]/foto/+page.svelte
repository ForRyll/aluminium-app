<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);
	let localError = $state('');

	const kinds = [
		{ key: 'sebelum', label: 'Sebelum dikerjakan' },
		{ key: 'proses', label: 'Sedang dikerjakan' },
		{ key: 'sesudah', label: 'Setelah selesai' }
	] as const;

	let full = $derived(data.photos.length >= data.max);

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
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<a href="/orders/{data.orderId}" class="text-sm text-brand-600 underline">← Kembali ke order</a>
	<h1 class="page-title mt-2">Foto order {data.orderNumber}</h1>
	<p class="mb-4 text-gray-600">{data.title}</p>

	{#if localError}
		<p class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{localError}</p>
	{/if}
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

	<!-- Unggah foto -->
	<section class="card mb-6">
		<h2 class="mb-3 text-lg font-semibold text-brand-900">
			Tambah foto ({data.photos.length} dari {data.max})
		</h2>

		{#if full}
			<p class="rounded-lg bg-yellow-100 p-3 text-yellow-800">
				Foto sudah penuh. Hapus foto lama kalau mau menambah yang baru.
			</p>
		{:else}
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				class="grid gap-3 sm:grid-cols-2"
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
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<label class="flex flex-col gap-1 text-sm">
					Tahap
					<select name="kind" class="field">
						<option value="sebelum">Sebelum dikerjakan</option>
						<option value="proses" selected>Sedang dikerjakan</option>
						<option value="sesudah">Setelah selesai</option>
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Keterangan (opsional)
					<input name="caption" maxlength="200" placeholder="mis. Rangka kusen terpasang" class="field" />
				</label>
				<label class="flex flex-col gap-1 text-sm sm:col-span-2">
					Foto
					<input name="file" type="file" accept="image/*" required class="field" />
				</label>
				<button disabled={submitting} class="btn sm:col-span-2">
					{submitting ? 'Mengunggah...' : 'Unggah foto'}
				</button>
			</form>
		{/if}
	</section>

	<!-- Galeri per tahap -->
	{#each kinds as k (k.key)}
		{@const list = data.photos.filter((p) => p.kind === k.key)}
		<section class="mb-6">
			<h2 class="mb-2 text-lg font-semibold text-brand-900">
				{k.label} <span class="text-sm font-normal text-gray-500">({list.length})</span>
			</h2>

			{#if list.length === 0}
				<p class="card text-gray-500">Belum ada foto.</p>
			{:else}
				<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
					{#each list as p (p.id)}
						<figure class="card overflow-hidden p-0">
							<a href="/orders/{data.orderId}/foto/{p.id}" target="_blank" rel="noopener">
								<img
									src="/orders/{data.orderId}/foto/{p.id}"
									alt={p.caption ?? p.originalName}
									loading="lazy"
									class="aspect-square w-full object-cover"
								/>
							</a>
							<figcaption class="grid gap-2 p-3 text-sm">
								<p class="text-gray-700">{p.caption ?? p.originalName}</p>
								<p class="text-xs text-gray-400">{kb(p.size)}</p>
								<div class="flex gap-2">
									<a
										href="/orders/{data.orderId}/foto/{p.id}?download=1"
										class="btn-outline"
									>
										Unduh
									</a>
									<form
										method="POST"
										action="?/remove"
										use:enhance={({ cancel }) => {
											if (!confirm('Hapus foto ini?')) cancel();
										}}
									>
										<input type="hidden" name="photoId" value={p.id} />
										<button class="btn-danger">Hapus</button>
									</form>
								</div>
							</figcaption>
						</figure>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</main>