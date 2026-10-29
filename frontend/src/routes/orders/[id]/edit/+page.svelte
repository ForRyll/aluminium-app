<script lang="ts">
	import { enhance } from '$app/forms';
	import { rupiah } from '../../../../lib/api';
	import MoneyInput from '../../../../lib/components/MoneyInput.svelte';

	let { data, form } = $props();

	type Item = {
		mode: 'catalog' | 'free';
		materialId: string;
		description: string;
		unit: string;
		quantity: number;
		unitPrice: number;
	};

	// Nilai awal diambil dari order yang sedang diubah
	let items = $state<Item[]>(data.items);
	let title = $state(data.title);
	let laborCost = $state(data.laborCost);
	let deliveryCost = $state(data.deliveryCost);
	let otherCost = $state(data.otherCost);
	let offeredPrice = $state(data.offeredPrice);
	let notes = $state(data.notes);

	// true selama form dikirim, mencegah kiriman ganda
	let submitting = $state(false);

	function addItem(mode: Item['mode']) {
		items.push({ mode, materialId: '', description: '', unit: '', quantity: 1, unitPrice: 0 });
	}

	function removeItem(index: number) {
		items.splice(index, 1);
	}

	// Saat material diganti, isi nama, satuan, dan harga dari katalog
	function pickMaterial(item: Item) {
		const m = data.materials.find((m) => m.id === item.materialId);
		if (!m) return;
		item.description = m.name;
		item.unit = m.unit;
		item.unitPrice = Number(m.price);
	}

	function subtotal(item: Item): number {
		return Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
	}

	// Perkiraan langsung di layar. Angka resmi tampil di halaman detail setelah disimpan.
	let materialTotal = $derived(items.reduce((sum, i) => sum + subtotal(i), 0));
	let totalCost = $derived(
		materialTotal + (Number(laborCost) || 0) + (Number(deliveryCost) || 0) + (Number(otherCost) || 0)
	);
	let profit = $derived((Number(offeredPrice) || 0) - totalCost);
	let margin = $derived(Number(offeredPrice) > 0 ? (profit / Number(offeredPrice)) * 100 : 0);
</script>

<main class="mx-auto max-w-4xl p-4 md:p-6">
	<a href="/orders/{data.orderId}" class="text-sm text-brand-600 underline">← Kembali ke order</a>
	<h1 class="page-title mt-2">Ubah order {data.orderNumber}</h1>
	<p class="mb-4 text-gray-600">Pelanggan: {data.customerName} (tidak bisa diganti)</p>

	{#if form?.messages}
		<ul class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
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
		<!-- Data pekerjaan -->
		<section class="card">
			<label class="flex flex-col gap-1 text-sm">
				Nama pekerjaan
				<input name="title" required bind:value={title} class="field" />
			</label>
		</section>

		<!-- Daftar item -->
		<section class="card">
			<h2 class="mb-3 text-lg font-semibold text-brand-900">Item pekerjaan</h2>
			<input type="hidden" name="items" value={JSON.stringify(items)} />

			<div class="grid gap-3">
				{#each items as item, idx}
					<div class="grid gap-2 rounded-xl border border-brand-100 bg-brand-50/50 p-3 sm:grid-cols-6">
						<select bind:value={item.mode} class="field">
							<option value="catalog">Dari katalog</option>
							<option value="free">Isi bebas</option>
						</select>

						{#if item.mode === 'catalog'}
							<select
								value={item.materialId}
								onchange={(e) => {
									item.materialId = e.currentTarget.value;
									pickMaterial(item);
								}}
								class="field sm:col-span-3"
							>
								<option value="">— pilih material —</option>
								{#each data.materials as m (m.id)}
									<option value={m.id}>{m.name} ({m.unit})</option>
								{/each}
							</select>
						{:else}
							<input bind:value={item.description} placeholder="Deskripsi (mis. Kaca riben 5mm)"
								class="field sm:col-span-2" />
							<input bind:value={item.unit} placeholder="Satuan" class="field" />
						{/if}

						<input type="number" min="0.001" step="0.001" bind:value={item.quantity}
							placeholder="Jumlah" class="field" />
						<MoneyInput bind:value={item.unitPrice} placeholder="Harga satuan" />

						<div class="flex items-center justify-between sm:col-span-6">
							<span class="text-sm text-gray-600">
								{item.description || 'Item belum dipilih'} · Subtotal:
								<strong class="text-brand-800">{rupiah(subtotal(item))}</strong>
							</span>
							{#if items.length > 1}
								<button type="button" onclick={() => removeItem(idx)} class="btn-danger">Hapus item</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-3 flex flex-wrap gap-2">
				<button type="button" onclick={() => addItem('catalog')} class="btn-outline">+ Item dari katalog</button>
				<button type="button" onclick={() => addItem('free')} class="btn-outline">+ Item bebas</button>
			</div>
		</section>

		<!-- Biaya di luar bahan dan harga tawar -->
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
				Harga yang ditawarkan ke pelanggan
				<MoneyInput name="offeredPrice" bind:value={offeredPrice} class="max-w-xs" />
			</label>

			<label class="flex flex-col gap-1 text-sm">
				Catatan (opsional)
				<textarea name="notes" rows="2" bind:value={notes} class="field"></textarea>
			</label>
		</section>

		<!-- Perkiraan langsung -->
		<section class="rounded-2xl bg-brand-50 p-4">
			<p>Total modal (perkiraan): <strong class="text-brand-800">{rupiah(totalCost)}</strong></p>
			{#if Number(offeredPrice) > 0}
				<p class={profit < 0 ? 'text-red-600' : 'text-green-700'}>
					Untung di harga tawar: <strong>{rupiah(profit)}</strong> (margin {margin.toFixed(1)}%)
				</p>
			{/if}
		</section>

		<button disabled={submitting} class="btn py-3">
			{submitting ? 'Menyimpan...' : 'Simpan perubahan'}
		</button>
	</form>
</main>