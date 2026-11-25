<script lang="ts">
  import { goto } from '$app/navigation';
  import { rupiah } from '../../lib/api';

  let { data } = $props();

  const label: Record<string, string> = {
    draft: 'Draft',
    penawaran: 'Penawaran',
    deal: 'Deal',
    dikerjakan: 'Dikerjakan',
    selesai: 'Selesai',
    batal: 'Batal'
  };
  const badge: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    penawaran: 'bg-blue-100 text-blue-700',
    deal: 'bg-amber-100 text-amber-700',
    dikerjakan: 'bg-purple-100 text-purple-700',
    selesai: 'bg-green-100 text-green-700',
    batal: 'bg-red-100 text-red-700'
  };
  const dot: Record<string, string> = {
    draft: 'bg-gray-400',
    penawaran: 'bg-blue-500',
    deal: 'bg-amber-500',
    dikerjakan: 'bg-purple-500',
    selesai: 'bg-green-500',
    batal: 'bg-red-500'
  };
  const statuses = ['draft', 'penawaran', 'deal', 'dikerjakan', 'selesai', 'batal'];

  let list = $derived(data.list);
  let f = $derived(data.filters);
  let filtered = $derived(!!(f.q || f.status || f.unpaid));

  // Alamat halaman dengan filter yang sedang aktif, sebagian bisa diganti
  function href(over: Partial<{ q: string; status: string; unpaid: boolean; page: number }> = {}) {
    const v = { q: f.q, status: f.status, unpaid: f.unpaid, page: 1, ...over };
    const q = new URLSearchParams();
    if (v.q) q.set('q', v.q);
    if (v.status) q.set('status', v.status);
    if (v.unpaid) q.set('unpaid', '1');
    if (v.page > 1) q.set('page', String(v.page));
    const s = q.toString();
    return s ? `/orders?${s}` : '/orders';
  }

  // Nomor halaman: maksimal 5, di sekitar halaman sekarang
  let pages = $derived.by(() => {
    if (!list) return [] as number[];
    const start = Math.max(1, Math.min(list.page - 2, list.totalPages - 4));
    const end = Math.min(list.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  let from = $derived(list && list.total > 0 ? (list.page - 1) * list.pageSize + 1 : 0);
  let to = $derived(list ? Math.min(list.page * list.pageSize, list.total) : 0);

  const tgl = (d: string | null) =>
    d
      ? new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : '-';

  // Tanggal hari ini (zona waktu perangkat), format YYYY-MM-DD
  const today = new Date().toLocaleDateString('sv-SE');
  const overdue = (o: any) =>
    !!o.dueDate && ['deal', 'dikerjakan'].includes(o.status) && o.dueDate < today;
  const showDue = (o: any) => !!o.dueDate && ['deal', 'dikerjakan'].includes(o.status);
  const pct = (o: any) =>
    o.offeredPrice > 0 ? Math.min(100, Math.round((o.paid / o.offeredPrice) * 100)) : 0;

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'
    }`;
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
  <!-- Judul dan tombol -->
  <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Order</h1>
      <p class="text-sm text-gray-500">Semua pekerjaan, dari penawaran sampai selesai.</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <a
        href="/kalkulator"
        class="rounded-full border border-brand-300 px-5 py-2 font-medium text-brand-700 transition hover:bg-brand-100"
      >
        Kalkulator
      </a>
      <a href="/orders/new" class="btn">+ Order baru</a>
    </div>
  </div>

  <!-- Pencarian -->
  <form method="GET" class="mb-3 flex gap-2">
    {#if f.status}<input type="hidden" name="status" value={f.status} />{/if}
    {#if f.unpaid}<input type="hidden" name="unpaid" value="1" />{/if}
    <div class="relative flex-1">
      <svg
        class="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
      <input
        name="q"
        value={f.q}
        placeholder="Cari nomor order, pekerjaan, atau pelanggan"
        class="field pl-10"
      />
    </div>
    <button class="btn">Cari</button>
  </form>

  <!-- Filter status -->
  <div class="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
    <a href={href({ status: '' })} class={pill(!f.status)}>Semua</a>
    {#each statuses as s}
      <a href={href({ status: s })} class={pill(f.status === s)}>{label[s]}</a>
    {/each}
    <span class="mx-1 hidden w-px shrink-0 bg-gray-200 md:block"></span>
    <a href={href({ unpaid: !f.unpaid })} class={pill(f.unpaid)}>💰 Belum lunas</a>
  </div>

  {#if data.error || !list}
    <div class="card border-red-200 bg-red-50 text-red-700">Gagal memuat data: {data.error}</div>
  {:else if list.total === 0}
    <div class="card py-10 text-center">
      <div class="text-4xl">📋</div>
      {#if filtered}
        <p class="mt-2 font-medium">Tidak ada order yang cocok</p>
        <a href="/orders" class="mt-1 inline-block font-semibold text-brand-600 underline">Hapus pencarian dan filter</a>
      {:else}
        <p class="mt-2 font-medium">Belum ada order</p>
        <a href="/orders/new" class="btn mt-3 inline-block">+ Buat order pertama</a>
      {/if}
    </div>
  {:else}
    <p class="mb-2 text-sm text-gray-500">
      Menampilkan {from}–{to} dari {list.total} order
      {#if filtered}
        · <a href="/orders" class="font-semibold text-brand-600 underline">Hapus filter</a>
      {/if}
    </p>

    <!-- Tabel (layar lebar) -->
    <div class="card hidden overflow-hidden p-0 md:block">
      <table class="tbl w-full">
        <thead>
          <tr>
            <th>Pekerjaan</th>
            <th>Status</th>
            <th class="text-right">Harga tawar</th>
            <th>Pembayaran</th>
            <th>Jatuh tempo</th>
          </tr>
        </thead>
        <tbody>
          {#each list.items as o (o.id)}
            <tr
              class="cursor-pointer transition hover:bg-brand-50"
              onclick={() => goto(`/orders/${o.id}`)}
            >
              <td>
                <a href="/orders/{o.id}" class="font-semibold text-brand-700 hover:underline">{o.title}</a>
                <div class="text-xs whitespace-nowrap text-gray-500">
                  {o.orderNumber} · {o.customerName}
                </div>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {badge[o.status]}"
                >
                  <span class="h-1.5 w-1.5 rounded-full {dot[o.status]}"></span>{label[o.status]}
                </span>
              </td>
              <td class="text-right whitespace-nowrap tabular-nums">
                {o.offeredPrice !== null ? rupiah(o.offeredPrice) : '-'}
              </td>
              <td>
                {#if o.remaining === null}
                  <span class="text-gray-400">-</span>
                {:else}
                  <div class="w-40">
                    <div class="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full {o.remaining <= 0 ? 'bg-green-500' : 'bg-amber-400'}"
                        style="width: {pct(o)}%"
                      ></div>
                    </div>
                    <div class="mt-1 text-xs whitespace-nowrap">
                      {#if o.remaining <= 0}
                        <span class="font-semibold text-green-700">Lunas</span>
                      {:else}
                        <span class="font-semibold text-amber-700">Sisa {rupiah(o.remaining)}</span>
                      {/if}
                    </div>
                  </div>
                {/if}
              </td>
              <td class="whitespace-nowrap">
                {#if showDue(o)}
                  <span class={overdue(o) ? 'font-semibold text-red-600' : 'text-gray-700'}>
                    {tgl(o.dueDate)}{overdue(o) ? ' · lewat' : ''}
                  </span>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Kartu (HP) -->
    <div class="space-y-3 md:hidden">
      {#each list.items as o (o.id)}
        <a href="/orders/{o.id}" class="card block transition active:bg-brand-50">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-gray-500">{o.orderNumber}</span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold {badge[o.status]}"
            >
              <span class="h-1.5 w-1.5 rounded-full {dot[o.status]}"></span>{label[o.status]}
            </span>
          </div>
          <div class="mt-1 font-semibold text-brand-700">{o.title}</div>
          <div class="text-sm text-gray-600">{o.customerName}</div>

          <div class="mt-3 flex items-end justify-between gap-3">
            <div>
              <div class="text-xs text-gray-500">Harga tawar</div>
              <div class="font-semibold tabular-nums">
                {o.offeredPrice !== null ? rupiah(o.offeredPrice) : '-'}
              </div>
            </div>
            {#if showDue(o)}
              <div class="text-right text-xs {overdue(o) ? 'font-semibold text-red-600' : 'text-gray-500'}">
                Jatuh tempo<br />{tgl(o.dueDate)}{overdue(o) ? ' · lewat' : ''}
              </div>
            {/if}
          </div>

          {#if o.remaining !== null}
            <div class="mt-3">
              <div class="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full {o.remaining <= 0 ? 'bg-green-500' : 'bg-amber-400'}"
                  style="width: {pct(o)}%"
                ></div>
              </div>
              <div class="mt-1 text-xs">
                {#if o.remaining <= 0}
                  <span class="font-semibold text-green-700">Lunas</span>
                {:else}
                  <span class="font-semibold text-amber-700">Sisa {rupiah(o.remaining)}</span>
                {/if}
              </div>
            </div>
          {/if}
        </a>
      {/each}
    </div>

    <!-- Halaman bernomor -->
    {#if list.totalPages > 1}
      <nav class="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Halaman">
        {#if list.page > 1}
          <a
            href={href({ page: list.page - 1 })}
            class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >← Sebelumnya</a>
        {/if}
        {#each pages as p (p)}
          <a
            href={href({ page: p })}
            aria-current={p === list.page ? 'page' : undefined}
            class="rounded-full px-3.5 py-1.5 text-sm font-semibold {p === list.page
              ? 'bg-brand-600 text-white'
              : 'border border-brand-300 text-brand-700 hover:bg-brand-100'}"
          >{p}</a>
        {/each}
        {#if list.page < list.totalPages}
          <a
            href={href({ page: list.page + 1 })}
            class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >Berikutnya →</a>
        {/if}
      </nav>
    {/if}
  {/if}
</main>