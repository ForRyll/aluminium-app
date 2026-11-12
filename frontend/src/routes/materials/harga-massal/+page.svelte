<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../lib/api';
	import MoneyInput from '../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	// Isian yang sedang diisi
	let mode = $state<'percent' | 'amount'>('percent');
	let amount = $state(0);
	let all = $state(false);

	// true setelah isian diubah. Tombol Terapkan muncul lagi setelah pratinjau diulang.
	let dirty = $state(false);
	let busy = $state(false);

	let result = $derived(form?.result);
	let values = $derived(form?.values);

	// Ringkasan isian yang dipratinjau, ditampilkan di atas tabel
	function describe(v: NonNullable<typeof values>) {
		const parts: string[] = [];
		if (v.all) parts.push('semua material');
		else {
			if (v.category) parts.push(`kategori ${v.category}`);
			if (v.brand) parts.push(`merk ${v.brand}`);
			if (v.search) parts.push(`nama mengandung "${v.search}"`);
		}
		const nilai = v.mode === 'percent' ? `${v.value}%` : rupiah(Number(v.value));
		const bulat = v.rounding !== '0' ? `, dibulatkan ke ${rupiah(Number(v.rounding))}` : '';
		return `${parts.join(', ')}: ${v.direction} ${nilai}${bulat}`;
	}
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<a href="/materials" class="text-sm text-brand-600 underline">← Katalog material</a>
	<h1 class="page-title mt-2">Ubah harga massal</h1>
	<p class="mb-4 text-gray-500">
		Naikkan atau turunkan banyak harga sekaligus. Lihat pratinjaunya dulu, baru terapkan.
	</p>

	{#if data.error}
		<p class="rounded-lg bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else}
		<section class="card mb-4 text-sm text-gray-600">
			<ul class="list-disc space-y-1 pl-5">
				<li>Order yang sudah dibuat <strong>tidak ikut berubah</strong>, karena harganya sudah disalin saat order dibuat.</li>
				<li>Material yang harganya masih Rp 0 (belum diisi) dilewati.</li>
				<li>
					Sebelum perubahan besar, sebaiknya
					<a href="/export" class="font-semibold text-brand-600 underline">unduh backup</a> dulu.
				</li>
			</ul>
		</section>

		{#if form?.messages}
			<ul class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
				{#each form.messages as m}
					<li>{m}</li>
				{/each}
			</ul>
		{/if}

		<!-- Isian dan pratinjau -->
		<form
			method="POST"
			action="?/preview"
			class="card mb-4 grid gap-5"
			oninput={() => (dirty = true)}
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					dirty = false;
					busy = false;
				};
			}}
		>
			<fieldset class="grid gap-3 sm:grid-cols-3">
				<legend class="mb-2 font-semibold text-brand-900">1. Material mana yang diubah?</legend>
				<label class="flex flex-col gap-1 text-sm">
					Kategori
					<select name="category" class="field" disabled={all}>
						<option value="">Semua kategori</option>
						{#each data.categories as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Merk
					<select name="brand" class="field" disabled={all}>
						<option value="">Semua merk</option>
						{#each data.brands as b}
							<option value={b}>{b}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Nama mengandung kata
					<input name="search" placeholder="mis. 4 in" class="field" disabled={all} />
				</label>
				<label class="flex items-center gap-2 text-sm sm:col-span-3">
					<input type="checkbox" name="all" bind:checked={all} />
					Terapkan ke <strong>semua</strong> material ({data.total} material aktif), abaikan filter di atas
				</label>
			</fieldset>

			<fieldset class="grid gap-3 sm:grid-cols-4">
				<legend class="mb-2 font-semibold text-brand-900">2. Berapa perubahannya?</legend>

				<div class="flex flex-col gap-2 text-sm">
					<label class="flex items-center gap-2">
						<input type="radio" name="mode" value="percent" bind:group={mode} /> Persen (%)
					</label>
					<label class="flex items-center gap-2">
						<input type="radio" name="mode" value="amount" bind:group={mode} /> Nominal (Rp per satuan)
					</label>
				</div>

				<label class="flex flex-col gap-1 text-sm">
					Arah
					<select name="direction" class="field">
						<option value="naik">Naik</option>
						<option value="turun">Turun</option>
					</select>
				</label>

				<label class="flex flex-col gap-1 text-sm">
					Nilai
					{#if mode === 'percent'}
						<input name="value" type="number" step="0.01" min="0.01" max="100" required
							placeholder="mis. 5" class="field" />
					{:else}
						<MoneyInput name="value" bind:value={amount} required placeholder="mis. 1.000" />
					{/if}
				</label>

				<label class="flex flex-col gap-1 text-sm">
					Pembulatan harga baru
					<select name="rounding" class="field">
						<option value="0">Tidak dibulatkan</option>
						<option value="100">Ke Rp 100</option>
						<option value="500">Ke Rp 500</option>
						<option value="1000">Ke Rp 1.000</option>
					</select>
				</label>
			</fieldset>

			<div>
				<button disabled={busy} class="btn">
					{busy ? 'Menghitung...' : 'Lihat pratinjau'}
				</button>
				<span class="ml-2 text-sm text-gray-500">Belum ada yang tersimpan.</span>
			</div>
		</form>

		<!-- Hasil pratinjau atau penerapan -->
		{#if result && values}
			<section class="card overflow-x-auto p-0">
				<div class="p-4 pb-2">
					{#if result.applied}
						<p class="mb-3 rounded-lg bg-green-100 p-3 font-semibold text-green-700">
							Harga sudah diterapkan ke {result.changed} material.
						</p>
					{:else}
						<h2 class="text-lg font-semibold text-brand-900">Pratinjau (belum disimpan)</h2>
					{/if}
					<p class="text-sm text-gray-600">{describe(values)}</p>

					<div class="mt-3 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
						<div class="rounded-xl bg-brand-50 p-2">
							<p class="text-gray-600">Cocok dengan filter</p>
							<p class="text-lg font-bold text-brand-800">{result.matched}</p>
						</div>
						<div class="rounded-xl bg-amber-50 p-2">
							<p class="text-gray-600">{result.applied ? 'Berubah' : 'Akan berubah'}</p>
							<p class="text-lg font-bold text-amber-700">{result.changed}</p>
						</div>
						<div class="rounded-xl bg-gray-100 p-2">
							<p class="text-gray-600">Tidak berubah</p>
							<p class="text-lg font-bold text-gray-700">{result.unchanged}</p>
						</div>
						<div class="rounded-xl bg-gray-100 p-2">
							<p class="text-gray-600">Dilewati (harga Rp 0)</p>
							<p class="text-lg font-bold text-gray-700">{result.skippedNoPrice}</p>
						</div>
					</div>
				</div>

				{#if result.items.length > 0}
					<table class="tbl mt-3">
						<thead>
							<tr>
								<th>Nama</th>
								<th>Merk</th>
								<th>Satuan</th>
								<th class="text-right">Harga lama</th>
								<th class="text-right">Harga baru</th>
								<th class="text-right">Selisih</th>
							</tr>
						</thead>
						<tbody>
							{#each result.items as i (i.id)}
								<tr>
									<td class="font-medium">{i.name}</td>
									<td>{i.brand ?? '-'}</td>
									<td>{i.unit}</td>
									<td class="text-right">{rupiah(i.oldPrice)}</td>
									<td class="text-right font-semibold">{rupiah(i.newPrice)}</td>
									<td class="text-right {i.diff > 0 ? 'text-amber-700' : 'text-green-700'}">
										{i.diff > 0 ? '+' : '-'}{rupiah(Math.abs(i.diff))}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if result.changed > result.items.length}
						<p class="p-3 text-sm text-gray-500">
							Menampilkan {result.items.length} pertama dari {result.changed} yang berubah.
						</p>
					{/if}
				{:else}
					<p class="p-4 pt-0 text-gray-500">Tidak ada harga yang berubah dengan pengaturan ini.</p>
				{/if}

				<!-- Terapkan: hanya setelah pratinjau, dan hanya yang persis dipratinjau -->
				{#if !result.applied && result.changed > 0 && !dirty}
					<form
						method="POST"
						action="?/apply"
						class="border-t p-4"
						use:enhance={({ cancel }) => {
							if (!confirm(`Terapkan perubahan harga ke ${result.changed} material? Order lama tidak ikut berubah.`)) {
								cancel();
								return;
							}
							busy = true;
							return async ({ update }) => {
								await update({ reset: false });
								dirty = false;
								busy = false;
							};
						}}
					>
						<input type="hidden" name="category" value={values.category} />
						<input type="hidden" name="brand" value={values.brand} />
						<input type="hidden" name="search" value={values.search} />
						{#if values.all}<input type="hidden" name="all" value="on" />{/if}
						<input type="hidden" name="mode" value={values.mode} />
						<input type="hidden" name="direction" value={values.direction} />
						<input type="hidden" name="value" value={values.value} />
						<input type="hidden" name="rounding" value={values.rounding} />
						<button disabled={busy} class="btn">Terapkan ke {result.changed} material</button>
						<p class="mt-1 text-sm text-gray-500">
							Kalau mau mengubah isian, klik Lihat pratinjau lagi, dan tombol ini muncul kembali.
						</p>
					</form>
				{/if}
			</section>
		{/if}
	{/if}
</main>