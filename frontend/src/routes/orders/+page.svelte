<script lang="ts">
	import { rupiah } from '../../lib/api';

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

	const statuses = ['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai', 'batal'];

	let list = $derived(data.list);
	let f = $derived(data.filters);
	let filtered = $derived(!!(f.q || f.status || f.unpaid));

	// Alamat halaman tertentu, dengan pencarian dan filter yang sedang aktif
	function pageHref(p: number) {
		const q = new URLSearchParams();
		if (f.q) q.set('q', f.q);
		if (f.status) q.set('status', f.status);
		if (f.unpaid) q.set('unpaid', '1');
		if (p > 1) q.set('page', String(p));
		const s = q.toString();
		return s ? `/orders?${s}` : '/orders';
	}

	// Nomor halaman yang ditampilkan: maksimal 5, di sekitar halaman sekarang
	let pages = $derived.by(() => {
		if (!list) return [] as number[];
		const start = Math.max(1, Math.min(list.page - 2, list.totalPages - 4));
		const end = Math.min(list.totalPages, start + 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	});

	let from = $derived(list && list.total > 0 ? (list.page - 1) * list.pageSize + 1 : 0);
	let to = $derived(list ? Math.min(list.page * list.pageSize, list.total) : 0);

	const tgl = (d: string) =>
		new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
</script>

<main class="mx-auto max-w-5xl p-4 md:p-6">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="page-title">Order</h1>
			<p class="text-gray-500">Semua pekerjaan, dari penawaran sampai selesai.</p>
		</div>
		<a href="/orders/new" class="btn">+ Buat order baru</a>
	</div>

	<!-- Pencarian dan filter: dikirim lewat alamat, jadi hasilnya bisa disimpan atau dibagikan -->
	<form method="GET" class="card mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
		<input
			name="q"
			value={f.q}
			placeholder="Cari nomor order, pekerjaan, atau nama pelanggan..."
			class="field"
		/>
		<select name="status" class="field sm:w-44">
			<option value="">Semua status</option>
			{#each statuses as s}
				<option value={s} selected={f.status === s}>{s}</option>
			{/each}
		</select>
		<button class="btn">Cari</button>
		<label class="flex items-center gap-2 text-sm text-gray-600 sm:col-span-3">
			<input type="checkbox" name="unpaid" value="1" checked={f.unpaid} />
			Hanya yang <strong>belum lunas</strong> (sudah deal dan masih ada sisa tagihan)
		</label>
	</form>

	{#if data.error || !list}
		<p class="rounded-lg bg-red-100 p-3 text-red-700">Gagal memuat data: {data.error}</p>
	{:else if list.total === 0}
		<div class="card text-gray-500">
			{#if filtered}
				Tidak ada order yang cocok.
				<a href="/orders" class="font-semibold text-brand-600 underline">Hapus pencarian dan filter</a>
			{:else}
				Belum ada order.
			{/if}
		</div>
	{:else}
		<p class="mb-2 text-sm text-gray-500">
			Menampilkan {from}–{to} dari {list.total} order
			{#if filtered}
				· <a href="/orders" class="font-semibold text-brand-600 underline">Hapus filter</a>
			{/if}
		</p>

		<div class="card overflow-x-auto p-0">
			<table class="tbl">
				<thead>
					<tr>
						<th>No. Order</th>
						<th>Pekerjaan</th>
						<th>Pelanggan</th>
						<th>Status</th>
						<th class="text-right">Harga tawar</th>
						<th class="text-right">Sisa tagihan</th>
					</tr>
				</thead>
				<tbody>
					{#each list.items as o (o.id)}
						<tr>
							<td>
								<a href="/orders/{o.id}" class="font-medium text-brand-600 underline">
									{o.orderNumber}
								</a>
							</td>
							<td>
								{o.title}
								{#if o.dueDate && ['deal', 'dikerjakan'].includes(o.status)}
									<span class="block text-xs text-gray-400">Jatuh tempo {tgl(o.dueDate)}</span>
								{/if}
							</td>
							<td>{o.customerName}</td>
							<td>
								<span class="rounded-full px-3 py-1 text-sm {badge[o.status]}">{o.status}</span>
							</td>
							<td class="text-right">{o.offeredPrice !== null ? rupiah(o.offeredPrice) : '-'}</td>
							<td class="text-right">
								{#if o.remaining === null}
									<span class="text-gray-400">-</span>
								{:else if o.remaining <= 0}
									<span class="font-semibold text-green-700">Lunas</span>
								{:else}
									<span class="font-semibold text-amber-700">{rupiah(o.remaining)}</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Halaman bernomor -->
		{#if list.totalPages > 1}
			<nav class="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Halaman">
				{#if list.page > 1}
					<a href={pageHref(list.page - 1)} class="btn-outline">← Sebelumnya</a>
				{/if}
				{#each pages as p (p)}
					<a
						href={pageHref(p)}
						aria-current={p === list.page ? 'page' : undefined}
						class="rounded-full px-3 py-1 text-sm font-semibold {p === list.page
							? 'bg-brand-600 text-white'
							: 'border border-brand-200 text-brand-700 hover:bg-brand-50'}"
					>
						{p}
					</a>
				{/each}
				{#if list.page < list.totalPages}
					<a href={pageHref(list.page + 1)} class="btn-outline">Berikutnya →</a>
				{/if}
			</nav>
		{/if}
	{/if}
</main>