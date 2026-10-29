<script lang="ts">
	import { rupiah } from '../../../../lib/api';

	let { data } = $props();

	// Identitas usaha di kepala nota. Ubah sesuai data asli.
	const usaha = {
		nama: 'Nazril Aluminium',
		alamat: 'Alamat usaha diisi di sini',
		telp: 'No. telepon diisi di sini'
	};

	const format = (d: string) =>
		new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

	const tanggal = $derived(format(data.order.createdAt));
	const pay = $derived(data.pay);
	const lunas = $derived(pay !== null && pay.remaining !== null && pay.remaining <= 0);
</script>

<main class="nota mx-auto max-w-2xl p-8">
	<!-- Tombol ini tidak ikut tercetak -->
	<div class="no-print mb-6 flex items-center justify-between">
		<a href="/orders/{data.order.id}" class="text-sm text-brand-600 underline">← Kembali</a>
		<button onclick={() => window.print()}
			class="rounded bg-brand-500 px-4 py-2 font-semibold text-white">
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
		<div class="mb-8 ml-auto max-w-xs text-sm">
			<div class="flex justify-between text-lg">
				<span>Total</span>
				<strong>{rupiah(data.order.offeredPrice)}</strong>
			</div>

			<!-- Pembayaran yang sudah diterima -->
			{#if pay && pay.payments.length > 0}
				<div class="mt-3 border-t pt-2">
					{#each pay.payments as p (p.id)}
						<div class="flex justify-between">
							<span>{p.note ? `${p.note}, ` : ''}{format(p.paidAt)}</span>
							<span>{rupiah(p.amount)}</span>
						</div>
					{/each}
					<div class="mt-1 flex justify-between border-t pt-1">
						<span>Sudah dibayar</span>
						<span>{rupiah(pay.totalPaid)}</span>
					</div>
				</div>

				{#if lunas}
					<p class="mt-2 text-right text-lg font-bold">LUNAS</p>
				{:else if pay.remaining !== null}
					<div class="mt-1 flex justify-between text-lg font-bold">
						<span>Sisa tagihan</span>
						<span>{rupiah(pay.remaining)}</span>
					</div>
				{/if}
			{/if}
		</div>
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