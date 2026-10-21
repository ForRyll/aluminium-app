<script lang="ts">
	import { rupiah } from '../../../../lib/api';

	let { data } = $props();

	// Identitas usaha di kepala nota. Ubah sesuai data asli.
	const usaha = {
		nama: 'Nazril Aluminium',
		alamat: 'Alamat usaha diisi di sini',
		telp: 'No. telepon diisi di sini'
	};

	const tanggal = $derived(
		new Date(data.order.createdAt as unknown as string).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<main class="nota mx-auto max-w-2xl p-8">
	<!-- Tombol ini tidak ikut tercetak -->
	<div class="no-print mb-6 flex items-center justify-between">
		<a href="/orders/{data.order.id}" class="text-sm text-orange-600 underline">← Kembali</a>
		<button onclick={() => window.print()}
			class="rounded bg-orange-500 px-4 py-2 font-semibold text-white">
			Cetak / Simpan PDF
		</button>
	</div>

	<header class="mb-6 border-b-2 border-black pb-3">
		<h1 class="text-2xl font-bold">{usaha.nama}</h1>
		<p class="text-sm">{usaha.alamat}</p>
		<p class="text-sm">{usaha.telp}</p>
	</header>

	<section class="mb-6 grid grid-cols-2 gap-y-1 text-sm">
		<span>No. Nota</span><span>: {data.order.orderNumber}</span>
		<span>Tanggal</span><span>: {tanggal}</span>
		<span>Pelanggan</span><span>: {data.order.customer?.name}</span>
		{#if data.order.customer?.address}
			<span>Alamat</span><span>: {data.order.customer.address}</span>
		{/if}
	</section>

	<h2 class="mb-2 font-semibold">{data.order.title}</h2>

	<table class="mb-6 w-full border-collapse text-left text-sm">
		<thead>
			<tr class="border-y border-black">
				<th class="py-2">No</th>
				<th class="py-2">Uraian</th>
				<th class="py-2 text-right">Jumlah</th>
			</tr>
		</thead>
		<tbody>
			{#each data.order.items ?? [] as i, n (i.id)}
				<tr class="border-b">
					<td class="py-2">{n + 1}</td>
					<td class="py-2">{i.description}</td>
					<td class="py-2 text-right">{Number(i.quantity)} {i.unit}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if data.order.offeredPrice}
		<p class="mb-10 text-right text-lg">
			Total: <strong>{rupiah(data.order.offeredPrice)}</strong>
		</p>
	{:else}
		<p class="no-print mb-10 rounded bg-yellow-100 p-3 text-yellow-800">
			Harga belum diisi. Isi harga kesepakatan dulu di halaman order.
		</p>
	{/if}

	<footer class="grid grid-cols-2 text-center text-sm">
		<div>
			<p class="mb-16">Pelanggan</p>
			<p>( {data.order.customer?.name} )</p>
		</div>
		<div>
			<p class="mb-16">Hormat kami</p>
			<p>( {usaha.nama} )</p>
		</div>
	</footer>
</main>

<style>
	/* Saat dicetak: sembunyikan tombol dan pakai latar putih polos */
	@media print {
		:global(.no-print) {
			display: none !important;
		}
		:global(body) {
			background: white;
		}
		.nota {
			padding: 0;
			max-width: none;
		}
	}
</style>