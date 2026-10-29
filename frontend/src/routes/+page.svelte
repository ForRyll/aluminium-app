<script lang="ts">
	import { rupiah } from '../lib/api';

	let { data } = $props();

	// Warna lencana per status order
	const badge: Record<string, string> = {
		draft: 'bg-gray-200 text-gray-700',
		penawaran: 'bg-blue-100 text-blue-700',
		deal: 'bg-amber-100 text-amber-700',
		dikerjakan: 'bg-purple-100 text-purple-700',
		selesai: 'bg-green-100 text-green-700',
		batal: 'bg-red-100 text-red-700'
	};

	const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
	const labelBulan = (m: string) => bulan[Number(m.slice(5, 7)) - 1];

	// Angka ringkas untuk label grafik: 1700000 jadi "1,7 jt"
	const ringkas = (n: number) => {
		const f = (x: number) => x.toFixed(1).replace('.', ',').replace(/,0$/, '');
		if (n >= 1_000_000_000) return `${f(n / 1_000_000_000)} M`;
		if (n >= 1_000_000) return `${f(n / 1_000_000)} jt`;
		if (n >= 1_000) return `${f(n / 1_000)} rb`;
		return String(n);
	};

	let dash = $derived(data.dash);
	let maxIncome = $derived(
		dash ? Math.max(...dash.incomeByMonth.map((m) => m.total), 1) : 1
	);
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-brand-900">Beranda</h1>
			<p class="text-gray-500">Ringkasan usaha dan hal yang perlu ditindaklanjuti.</p>
		</div>
		<a href="/orders/new" class="rounded-full bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-700">
			+ Buat order baru
		</a>
	</div>

	{#if data.error || !dash}
		<p class="rounded bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else}
		<!-- Empat kartu ringkasan -->
		<div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-2xl bg-brand-50 p-4">
				<p class="text-sm text-gray-600">Pemasukan bulan ini</p>
				<p class="mt-1 text-2xl font-bold text-brand-800">{rupiah(dash.cards.incomeThisMonth)}</p>
			</div>
			<div class="rounded-2xl bg-amber-50 p-4">
				<p class="text-sm text-gray-600">Sisa tagihan</p>
				<p class="mt-1 text-2xl font-bold text-amber-700">{rupiah(dash.cards.outstanding)}</p>
			</div>
			<div class="rounded-2xl bg-purple-50 p-4">
				<p class="text-sm text-gray-600">Sedang dikerjakan</p>
				<p class="mt-1 text-2xl font-bold text-purple-700">{dash.cards.activeOrders} order</p>
			</div>
			<div class="rounded-2xl bg-gray-100 p-4">
				<p class="text-sm text-gray-600">Menunggu keputusan</p>
				<p class="mt-1 text-2xl font-bold text-gray-700">{dash.cards.pendingOrders} order</p>
			</div>
		</div>

		<!-- Grafik pemasukan 6 bulan -->
		<section class="mb-6 rounded-2xl border p-4">
			<h2 class="mb-4 text-lg font-semibold">Pemasukan 6 bulan terakhir</h2>
			<div class="flex h-48 items-end gap-3">
				{#each dash.incomeByMonth as m (m.month)}
					<div class="flex h-full flex-1 flex-col items-center justify-end gap-1" title={rupiah(m.total)}>
						<span class="text-xs text-gray-500">{m.total > 0 ? ringkas(m.total) : ''}</span>
						<div
							class="w-full rounded-t-lg {m.month === dash.thisMonth ? 'bg-brand-600' : 'bg-brand-200'}"
							style="height: {Math.max((m.total / maxIncome) * 80, m.total > 0 ? 4 : 1)}%"
						></div>
						<span class="text-xs {m.month === dash.thisMonth ? 'font-bold text-brand-700' : 'text-gray-500'}">
							{labelBulan(m.month)}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Perlu perhatian -->
		<div class="mb-6 grid gap-4 lg:grid-cols-2">
			<section class="rounded-2xl border p-4">
				<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					Margin tipis atau rugi
					{#if dash.lowMargin.count > 0}
						<span class="rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-700">
							{dash.lowMargin.count}
						</span>
					{/if}
				</h2>
				{#if dash.lowMargin.items.length === 0}
					<p class="rounded-lg bg-green-50 p-3 text-green-700">Semua order aman, tidak ada margin tipis.</p>
				{:else}
					<ul class="grid gap-2">
						{#each dash.lowMargin.items as o (o.id)}
							<li>
								<a href="/orders/{o.id}" class="block rounded-lg border p-3 hover:bg-brand-50">
									<div class="flex items-center justify-between gap-2">
										<span class="font-medium">{o.orderNumber} · {o.customerName}</span>
										<span
											class="rounded px-2 py-0.5 text-xs font-semibold uppercase {o.level === 'rugi'
												? 'bg-red-100 text-red-700'
												: 'bg-yellow-100 text-yellow-800'}"
										>
											{o.level}
										</span>
									</div>
									<p class="text-sm text-gray-500">{o.title}</p>
									<p class="text-sm">
										Harga {rupiah(o.price)} · untung
										<strong class={o.profit < 0 ? 'text-red-600' : ''}>{rupiah(o.profit)}</strong>
										({o.marginPercent}%)
									</p>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="rounded-2xl border p-4">
				<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					Sisa tagihan terbesar
					{#if dash.unpaid.count > 0}
						<span class="rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-700">
							{dash.unpaid.count}
						</span>
					{/if}
				</h2>
				{#if dash.unpaid.items.length === 0}
					<p class="rounded-lg bg-green-50 p-3 text-green-700">Semua tagihan sudah lunas.</p>
				{:else}
					<ul class="grid gap-2">
						{#each dash.unpaid.items as o (o.id)}
							<li>
								<a href="/orders/{o.id}/pembayaran" class="block rounded-lg border p-3 hover:bg-brand-50">
									<div class="flex items-center justify-between gap-2">
										<span class="font-medium">{o.orderNumber} · {o.customerName}</span>
										<span class="rounded px-2 py-0.5 text-xs {badge[o.status]}">{o.status}</span>
									</div>
									<p class="text-sm text-gray-500">{o.title}</p>
									<p class="text-sm">
										Sisa <strong>{rupiah(o.remaining)}</strong> dari {rupiah(o.agreedPrice)}
									</p>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>

		<!-- Order terbaru -->
		<section class="rounded-2xl border p-4">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Order terbaru</h2>
				<a href="/orders" class="text-sm font-semibold text-brand-600">Lihat semua →</a>
			</div>
			{#if dash.recent.length === 0}
				<p class="text-gray-500">Belum ada order.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left">
						<tbody>
							{#each dash.recent as o (o.id)}
								<tr class="border-b last:border-0">
									<td class="p-2">
										<a href="/orders/{o.id}" class="font-medium text-brand-600 underline">{o.orderNumber}</a>
									</td>
									<td class="p-2">{o.title}</td>
									<td class="p-2 text-gray-600">{o.customerName}</td>
									<td class="p-2">
										<span class="rounded px-2 py-1 text-sm {badge[o.status]}">{o.status}</span>
									</td>
									<td class="p-2 text-right">{o.offeredPrice !== null ? rupiah(o.offeredPrice) : '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</main>