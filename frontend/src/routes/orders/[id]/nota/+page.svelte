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

<svelte:head>
	<!-- Ukuran kertas dan margin saat dicetak -->
	{@html '<style>@page { size: A4; margin: 14mm; }</style>'}
</svelte:head>

<main class="nota mx-auto max-w-[210mm] p-4 md:p-6 print:max-w-none print:p-0">
	<!-- Tombol ini tidak ikut tercetak -->
	<div class="no-print mb-4">
		<div class="flex items-center justify-between">
			<a href="/orders/{data.order.id}" class="text-sm font-medium text-brand-600 hover:underline">← Kembali</a>
			<button onclick={() => window.print()} class="btn">Cetak / Simpan PDF</button>
		</div>
		<p class="mt-2 text-right text-xs text-gray-500">
			Di jendela cetak, matikan opsi "Header dan footer" supaya alamat web tidak ikut tercetak.
		</p>
	</div>

	<article
		class="bg-white p-8 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 print:p-0 print:shadow-none print:ring-0"
	>
		<!-- Kop -->
		<header class="flex items-start justify-between gap-4 border-b-2 border-brand-600 pb-4">
			<div class="flex items-center gap-3">
				<img src="/logo.png" alt="" class="h-14 w-auto" />
				<div>
					<h1 class="text-xl font-bold text-brand-900">{usaha.nama}</h1>
					<p class="text-xs text-gray-600">{usaha.alamat}</p>
					<p class="text-xs text-gray-600">{usaha.telp}</p>
				</div>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold tracking-widest text-brand-600">NOTA</p>
				<p class="font-semibold">{data.order.orderNumber}</p>
				<p class="text-xs text-gray-600">{tanggal}</p>
			</div>
		</header>

		<!-- Pelanggan -->
		<section class="my-5 grid gap-1 sm:grid-cols-2">
			<div>
				<p class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Pelanggan</p>
				<p class="text-base font-semibold">{data.order.customer?.name}</p>
				{#if data.order.customer?.phone}<p>{data.order.customer.phone}</p>{/if}
				{#if data.order.customer?.address}<p class="text-gray-700">{data.order.customer.address}</p>{/if}
			</div>
			<div class="sm:text-right">
				<p class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Pekerjaan</p>
				<p class="text-base font-semibold">{data.order.title}</p>
			</div>
		</section>

		<!-- Uraian -->
		<table class="mb-6 w-full border-collapse text-left">
			<thead>
				<tr class="bg-brand-50 text-brand-900" style="print-color-adjust: exact; -webkit-print-color-adjust: exact;">
					<th class="w-10 border-y border-brand-200 px-2 py-2">No</th>
					<th class="border-y border-brand-200 px-2 py-2">Uraian</th>
					<th class="border-y border-brand-200 px-2 py-2 text-right">Jumlah</th>
				</tr>
			</thead>
			<tbody>
				{#each data.order.items ?? [] as i, n (i.id)}
					<tr class="break-inside-avoid border-b border-gray-200">
						<td class="px-2 py-2 align-top text-gray-500">{n + 1}</td>
						<td class="px-2 py-2">{i.description}</td>
						<td class="px-2 py-2 text-right whitespace-nowrap">{Number(i.quantity)} {i.unit}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Total dan pembayaran -->
		{#if data.order.offeredPrice}
			<section class="mb-10 ml-auto max-w-sm break-inside-avoid">
				<div class="flex items-center justify-between rounded-lg border-2 border-brand-600 px-4 py-3">
					<span class="text-base">Total</span>
					<strong class="text-xl">{rupiah(data.order.offeredPrice)}</strong>
				</div>

				{#if pay && pay.payments.length > 0}
					<div class="mt-3 px-1">
						<p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">Pembayaran diterima</p>
						{#each pay.payments as p (p.id)}
							<div class="flex justify-between gap-3 py-0.5">
								<span class="text-gray-700">{p.note ? `${p.note}, ` : ''}{format(p.paidAt)}</span>
								<span class="whitespace-nowrap">{rupiah(p.amount)}</span>
							</div>
						{/each}
						<div class="mt-1 flex justify-between border-t border-gray-300 pt-1 font-semibold">
							<span>Sudah dibayar</span>
							<span>{rupiah(pay.totalPaid)}</span>
						</div>

						{#if lunas}
							<div class="mt-4 flex justify-end">
								<span
									class="-rotate-6 rounded-md border-4 border-green-600 px-5 py-1 text-2xl font-extrabold tracking-widest text-green-600"
								>
									LUNAS
								</span>
							</div>
						{:else if pay.remaining !== null}
							<div class="mt-2 flex justify-between text-lg font-bold text-brand-900">
								<span>Sisa tagihan</span>
								<span>{rupiah(pay.remaining)}</span>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{:else}
			<p class="no-print mb-10 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
				Harga belum diisi. Isi harga kesepakatan dulu di halaman order.
			</p>
		{/if}

		<!-- Tanda tangan -->
		<footer class="grid grid-cols-2 gap-8 text-center break-inside-avoid">
			<div>
				<p class="mb-16">Pelanggan</p>
				<p class="mx-auto w-48 border-t border-gray-500 pt-1">{data.order.customer?.name}</p>
			</div>
			<div>
				<p class="mb-16">Hormat kami</p>
				<p class="mx-auto w-48 border-t border-gray-500 pt-1">{usaha.nama}</p>
			</div>
		</footer>

		<p class="mt-8 text-center text-xs text-gray-500">Terima kasih atas kepercayaan Anda.</p>
	</article>
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
	}
</style>