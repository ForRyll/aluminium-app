<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../lib/api';

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

	// Harga satuan item: dari katalog, atau diisi bebas
	function priceOf(item: Item): number {
		if (item.mode === 'free') return Number(item.unitPrice) || 0;
		const m = data.materials.find((m) => m.id === item.materialId);
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
	let profit = $derived((Number(offeredPrice) || 0) - totalCost);
	let margin = $derived(Number(offeredPrice) > 0 ? (profit / Number(offeredPrice)) * 100 : 0);
</script>

<main class="mx-auto max-w-4xl p-6">
	<a href="/orders" class="text-sm text-brand-600 underline">← Semua order</a>
	<h1 class="mt-2 mb-4 text-2xl font-bold">Buat order baru</h1>

	{#if data.error}
		<p class="rounded bg-red-100 p-3 text-red-700">{data.error}</p>
	{:else}
		{#if form?.messages}
			<ul class="mb-4 rounded bg-red-100 p-3 text-red-700">
				{#each form.messages as m}
					<li>{m}</li>
				{/each}
			</ul>
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
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="flex flex-col text-sm">
					Pelanggan
					<select name="customerId" required class="rounded border px-3 py-2">
						<option value="">— pilih pelanggan —</option>
						{#each data.customers as c (c.id)}
							<option value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col text-sm">
					Nama pekerjaan
					<input name="title" required placeholder="mis. Kusen dan jendela rumah Pak Budi"
						class="rounded border px-3 py-2" />
				</label>
			</div>

			<!-- Daftar item -->
			<h2 class="mt-2 text-lg font-semibold">Item pekerjaan</h2>
			<input type="hidden" name="items" value={JSON.stringify(items)} />

			{#each items as item, idx}
				<div class="grid gap-2 rounded border p-3 sm:grid-cols-6">
					<select bind:value={item.mode} class="rounded border px-2 py-2 sm:col-span-1">
						<option value="catalog">Dari katalog</option>
						<option value="free">Isi bebas</option>
					</select>

					{#if item.mode === 'catalog'}
						<select bind:value={item.materialId} class="rounded border px-2 py-2 sm:col-span-3">
							<option value="">— pilih material —</option>
							{#each data.materials as m (m.id)}
								<option value={m.id}>{m.name} — {rupiah(m.price)}/{m.unit}</option>
							{/each}
						</select>
					{:else}
						<input bind:value={item.description} placeholder="Deskripsi (mis. Kaca riben 5mm)"
							class="rounded border px-2 py-2 sm:col-span-2" />
						<input bind:value={item.unit} placeholder="Satuan" class="rounded border px-2 py-2" />
					{/if}

					<input type="number" min="0.001" step="0.001" bind:value={item.quantity}
						placeholder="Jumlah" class="rounded border px-2 py-2" />

					{#if item.mode === 'free'}
						<input type="number" min="0" step="0.01" bind:value={item.unitPrice}
							placeholder="Harga satuan" class="rounded border px-2 py-2 sm:col-span-2" />
					{/if}

					<div class="flex items-center justify-between sm:col-span-6">
						<span class="text-sm text-gray-600">Subtotal: <strong>{rupiah(subtotal(item))}</strong></span>
						{#if items.length > 1}
							<button type="button" onclick={() => removeItem(idx)}
								class="rounded border border-red-400 px-3 py-1 text-sm text-red-600">
								Hapus item
							</button>
						{/if}
					</div>
				</div>
			{/each}

			<div class="flex gap-2">
				<button type="button" onclick={() => addItem('catalog')}
					class="rounded border px-3 py-2 text-sm">+ Item dari katalog</button>
				<button type="button" onclick={() => addItem('free')}
					class="rounded border px-3 py-2 text-sm">+ Item bebas</button>
			</div>

			<!-- Biaya lain -->
			<h2 class="mt-2 text-lg font-semibold">Biaya di luar bahan</h2>
			<div class="grid gap-3 sm:grid-cols-3">
				<label class="flex flex-col text-sm">
					Upah tukang (Rp)
					<input name="laborCost" type="number" min="0" step="1000" bind:value={laborCost}
						class="rounded border px-3 py-2" />
				</label>
				<label class="flex flex-col text-sm">
					Ongkir (Rp)
					<input name="deliveryCost" type="number" min="0" step="1000" bind:value={deliveryCost}
						class="rounded border px-3 py-2" />
				</label>
				<label class="flex flex-col text-sm">
					Biaya lain (Rp)
					<input name="otherCost" type="number" min="0" step="1000" bind:value={otherCost}
						class="rounded border px-3 py-2" />
				</label>
			</div>

			<label class="flex flex-col text-sm">
				Harga yang ditawarkan ke pelanggan (Rp)
				<input name="offeredPrice" type="number" min="0" step="1000" bind:value={offeredPrice}
					class="max-w-xs rounded border px-3 py-2" />
			</label>

			<label class="flex flex-col text-sm">
				Catatan (opsional)
				<textarea name="notes" rows="2" class="rounded border px-3 py-2"></textarea>
			</label>

			<!-- Perkiraan langsung -->
			<div class="rounded border bg-gray-50 p-4">
				<p>Total modal (perkiraan): <strong>{rupiah(totalCost)}</strong></p>
				{#if Number(offeredPrice) > 0}
					<p class={profit < 0 ? 'text-red-600' : 'text-green-700'}>
						Untung di harga tawar: <strong>{rupiah(profit)}</strong> (margin {margin.toFixed(1)}%)
					</p>
				{/if}
			</div>

			<button
				disabled={submitting}
				class="rounded bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
			>
				{submitting ? 'Menyimpan...' : 'Simpan order'}
			</button>
		</form>
	{/if}
</main>