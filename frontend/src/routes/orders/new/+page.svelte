<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../lib/api';
	import MoneyInput from '../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	type Item = {
		mode: 'catalog' | 'free';
		materialId: string;
		description: string;
		unit: string;
		quantity: number;
		unitPrice: number;
	};

	let items = $state<Item[]>([
		{ mode: 'catalog', materialId: '', description: '', unit: '', quantity: 1, unitPrice: 0 }
	]);
	let laborCost = $state(0);
	let deliveryCost = $state(0);
	let otherCost = $state(0);
	let offeredPrice = $state(0);

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);

	function addItem(mode: Item['mode']) {
		items.push({ mode, materialId: '', description: '', unit: '', quantity: 1, unitPrice: 0 });
	}

	function removeItem(index: number) {
		items.splice(index, 1);
	}

	const materialOf = (item: Item) => data.materials.find((m) => m.id === item.materialId);

	// Harga satuan item: dari katalog, atau diisi bebas
	function priceOf(item: Item): number {
		if (item.mode === 'free') return Number(item.unitPrice) || 0;
		const m = materialOf(item);
		return m ? Number(m.price) : 0;
	}

	function subtotal(item: Item): number {
		return Math.round((Number(item.quantity) || 0) * priceOf(item));
	}

	// Perkiraan langsung di layar. Angka resmi tampil di halaman detail setelah disimpan.
	let materialTotal = $derived(items.reduce((sum, i) => sum + subtotal(i), 0));
	let totalCost = $derived(
		materialTotal + (Number(laborCost) || 0) + (Number(deliveryCost) || 0) + (Number(otherCost) || 0)
	);
	let price = $derived(Number(offeredPrice) || 0);
	let profit = $derived(price - totalCost);
	let margin = $derived(price > 0 ? (profit / price) * 100 : 0);

	// Harga tawar yang menghasilkan margin tertentu, dibulatkan ke atas ke 1.000
	const withMargin = (m: number) => (totalCost > 0 ? Math.ceil(totalCost / (1 - m / 100) / 1000) * 1000 : 0);

	let resultCls = $derived(
		profit < 0
			? 'border-red-300 bg-red-50 text-red-700'
			: margin < 15
				? 'border-yellow-300 bg-yellow-50 text-yellow-800'
				: 'border-green-300 bg-green-50 text-green-700'
	);
	let resultLabel = $derived(profit < 0 ? 'Rugi' : margin < 15 ? 'Margin tipis' : 'Aman');

	const seg = (on: boolean) =>
		`rounded-full px-3 py-1 transition ${on ? 'bg-brand-600 text-white' : 'text-brand-700 hover:bg-brand-100'}`;
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
	<a href="/orders" class="text-sm font-medium text-brand-600 hover:underline">← Semua order</a>
	<h1 class="page-title mt-2 mb-4">Buat order baru</h1>

	{#if data.error}
		<p class="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{data.error}</p>
	{:else}
		{#if form?.messages}
			<ul class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
				{#each form.messages as m}
					<li>{m}</li>
				{/each}
			</ul>
		{/if}

		<form
			method="POST"
			class="grid items-start gap-4 lg:grid-cols-[1fr_340px]"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<!-- Kiri: isian -->
			<div class="grid gap-4">
				<!-- Data pekerjaan -->
				<section class="card grid gap-3 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm">
						<span class="flex items-center justify-between">
							Pelanggan
							<a href="/customers" class="text-xs text-brand-600 hover:underline">+ Pelanggan baru</a>
						</span>
						<select name="customerId" required class="field">
							<option value="">— pilih pelanggan —</option>
							{#each data.customers as c (c.id)}
								<option value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						Nama pekerjaan
						<input name="title" required placeholder="mis. Kusen dan jendela rumah Pak Budi" class="field" />
					</label>
				</section>

				<!-- Daftar item -->
				<section class="card">
					<div class="mb-3 flex items-center gap-2">
						<h2 class="text-lg font-semibold text-brand-900">Item pekerjaan</h2>
						<span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
							{items.length}
						</span>
					</div>
					<input type="hidden" name="items" value={JSON.stringify(items)} />

					<div class="grid gap-3">
						{#each items as item, idx}
							<div class="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
								<div class="mb-2 flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span
											class="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
										>
											{idx + 1}
										</span>
										<div class="inline-flex rounded-full border border-brand-200 bg-white p-0.5 text-xs font-medium">
											<button type="button" class={seg(item.mode === 'catalog')} onclick={() => (item.mode = 'catalog')}>
												Katalog
											</button>
											<button type="button" class={seg(item.mode === 'free')} onclick={() => (item.mode = 'free')}>
												Bebas
											</button>
										</div>
									</div>
									{#if items.length > 1}
										<button
											type="button"
											onclick={() => removeItem(idx)}
											class="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
										>
											Hapus
										</button>
									{/if}
								</div>

								{#if item.mode === 'catalog'}
									<div class="flex flex-wrap items-end gap-3">
										<label class="block min-w-56 flex-1 text-xs text-gray-500">
											Material
											<select bind:value={item.materialId} class="field mt-1 text-base text-gray-900">
												<option value="">— pilih material —</option>
												{#each data.materials as m (m.id)}
													<option value={m.id}>{m.name} — {rupiah(m.price)}/{m.unit}</option>
												{/each}
											</select>
										</label>
										<label class="block w-32 text-xs text-gray-500">
											Jumlah{materialOf(item) ? ` (${materialOf(item)?.unit})` : ''}
											<input
												type="number"
												min="0.001"
												step="0.001"
												bind:value={item.quantity}
												class="field mt-1 text-base text-gray-900"
											/>
										</label>
									</div>
								{:else}
									<div class="flex flex-wrap items-end gap-3">
										<label class="block min-w-56 flex-1 text-xs text-gray-500">
											Deskripsi
											<input
												bind:value={item.description}
												placeholder="mis. Kaca riben 5mm"
												class="field mt-1 text-base text-gray-900"
											/>
										</label>
										<label class="block w-24 text-xs text-gray-500">
											Satuan
											<input bind:value={item.unit} placeholder="m²" class="field mt-1 text-base text-gray-900" />
										</label>
										<label class="block w-28 text-xs text-gray-500">
											Jumlah
											<input
												type="number"
												min="0.001"
												step="0.001"
												bind:value={item.quantity}
												class="field mt-1 text-base text-gray-900"
											/>
										</label>
										<label class="block w-44 text-xs text-gray-500">
											Harga satuan
											<MoneyInput bind:value={item.unitPrice} class="mt-1 text-base text-gray-900" />
										</label>
									</div>
								{/if}

								<p class="mt-2 text-right text-sm text-gray-600">
									Subtotal <strong class="ml-1 text-brand-800">{rupiah(subtotal(item))}</strong>
								</p>
							</div>
						{/each}
					</div>

					<div class="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => addItem('catalog')}
							class="rounded-full border border-dashed border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100/50"
						>
							+ Item dari katalog
						</button>
						<button
							type="button"
							onclick={() => addItem('free')}
							class="rounded-full border border-dashed border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100/50"
						>
							+ Item bebas
						</button>
					</div>
				</section>

				<!-- Biaya di luar bahan -->
				<section class="card grid gap-4">
					<h2 class="text-lg font-semibold text-brand-900">Biaya di luar bahan</h2>
					<div class="grid gap-3 sm:grid-cols-3">
						<label class="flex flex-col gap-1 text-sm">
							Upah tukang
							<MoneyInput name="laborCost" bind:value={laborCost} />
						</label>
						<label class="flex flex-col gap-1 text-sm">
							Ongkir
							<MoneyInput name="deliveryCost" bind:value={deliveryCost} />
						</label>
						<label class="flex flex-col gap-1 text-sm">
							Biaya lain
							<MoneyInput name="otherCost" bind:value={otherCost} />
						</label>
					</div>

					<label class="flex flex-col gap-1 text-sm">
						Catatan (opsional)
						<textarea name="notes" rows="2" class="field"></textarea>
					</label>
				</section>
			</div>

			<!-- Kanan: ringkasan -->
			<aside class="card grid gap-4 lg:sticky lg:top-4">
				<h2 class="text-lg font-semibold text-brand-900">Ringkasan</h2>

				<dl class="grid grid-cols-2 gap-y-1 text-sm">
					<dt class="text-gray-600">Bahan</dt>
					<dd class="text-right">{rupiah(materialTotal)}</dd>
					<dt class="text-gray-600">Upah tukang</dt>
					<dd class="text-right">{rupiah(Number(laborCost) || 0)}</dd>
					<dt class="text-gray-600">Ongkir</dt>
					<dd class="text-right">{rupiah(Number(deliveryCost) || 0)}</dd>
					<dt class="text-gray-600">Biaya lain</dt>
					<dd class="text-right">{rupiah(Number(otherCost) || 0)}</dd>
					<dt class="mt-1 border-t pt-1 font-bold">Total modal</dt>
					<dd class="mt-1 border-t pt-1 text-right font-bold text-brand-800">{rupiah(totalCost)}</dd>
				</dl>

				<div class="grid gap-2">
					<label class="flex flex-col gap-1 text-sm">
						Harga yang ditawarkan
						<MoneyInput name="offeredPrice" bind:value={offeredPrice} />
					</label>
					<div class="flex flex-wrap items-center gap-1.5 text-xs">
						<span class="text-gray-500">Isi dari margin:</span>
						{#each [15, 20, 30] as m}
							<button
								type="button"
								disabled={totalCost <= 0}
								onclick={() => (offeredPrice = withMargin(m))}
								class="rounded-full border border-brand-300 px-3 py-1 font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-40"
							>
								{m}%
							</button>
						{/each}
					</div>
				</div>

				{#if price > 0}
					<div class="rounded-xl border p-3 {resultCls}">
						<p class="text-sm font-bold uppercase">{resultLabel}</p>
						<p class="text-xl font-bold">{rupiah(profit)}</p>
						<p class="text-sm">margin {margin.toFixed(1)}%</p>
					</div>
				{:else}
					<p class="rounded-xl bg-brand-50 p-3 text-sm text-gray-600">
						Isi harga tawar untuk melihat untung atau rugi.
					</p>
				{/if}

				<button disabled={submitting} class="btn py-3">
					{submitting ? 'Menyimpan...' : 'Simpan order'}
				</button>
			</aside>
		</form>
	{/if}
</main>