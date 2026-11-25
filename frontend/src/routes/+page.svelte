<script lang="ts">
  import { onMount } from 'svelte';
  import { rupiah } from '../lib/api';

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

  // Penanda jatuh tempo: merah kalau terlambat, kuning kalau tinggal 7 hari atau kurang
  const dueInfo = (left: number) => {
    if (left < 0) return { text: `Terlambat ${-left} hari`, cls: 'bg-red-100 text-red-700' };
    if (left === 0) return { text: 'Hari ini', cls: 'bg-amber-100 text-amber-800' };
    if (left <= 7) return { text: `${left} hari lagi`, cls: 'bg-amber-100 text-amber-800' };
    return { text: `${left} hari lagi`, cls: 'bg-gray-100 text-gray-700' };
  };

  const tgl = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Sapaan dihitung di browser (jam perangkat), supaya tidak beda dengan server
  let hour = $state(-1);
  let todayText = $state('');
  onMount(() => {
    hour = new Date().getHours();
    todayText = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });
  const greeting = $derived(
    hour < 0 ? 'Halo' : hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
  );

  let dash = $derived(data.dash);
  let up = $derived(data.upcoming);

  let maxIncome = $derived(dash ? Math.max(...dash.incomeByMonth.map((m) => m.total), 1) : 1);
  let total6 = $derived(dash ? dash.incomeByMonth.reduce((s, m) => s + m.total, 0) : 0);

  // Pemasukan bulan ini dibanding bulan lalu
  let cur = $derived(
    dash ? (dash.incomeByMonth.find((m) => m.month === dash.thisMonth)?.total ?? 0) : 0
  );
  let prev = $derived.by(() => {
    if (!dash) return 0;
    const i = dash.incomeByMonth.findIndex((m) => m.month === dash.thisMonth);
    return i > 0 ? dash.incomeByMonth[i - 1].total : 0;
  });
  let delta = $derived(prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

  // Kalimat ringkasan di bawah sapaan
  let summary = $derived.by(() => {
    if (!dash) return '';
    const p: string[] = [];
    p.push(
      dash.cards.activeOrders > 0
        ? `${dash.cards.activeOrders} order sedang dikerjakan`
        : 'Tidak ada order yang sedang dikerjakan'
    );
    if (dash.unpaid.count > 0) p.push(`${dash.unpaid.count} tagihan belum lunas`);
    if (dash.lowMargin.count > 0) p.push(`${dash.lowMargin.count} order margin tipis`);
    return p.join(' · ');
  });

  const shortcuts = [
    { href: '/kalkulator', icon: '🧮', label: 'Kalkulator' },
    { href: '/orders/new', icon: '📝', label: 'Order baru' },
    { href: '/customers', icon: '👥', label: 'Pelanggan' },
    { href: '/harga', icon: '🏷️', label: 'Harga' }
  ];
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
  <!-- Sapaan -->
  <div class="mb-5">
    <h1 class="text-2xl font-bold text-brand-900">{greeting} 👋</h1>
    <p class="text-sm text-gray-500">{todayText}</p>
    {#if dash}<p class="mt-1 text-gray-700">{summary}</p>{/if}
  </div>

  {#if data.error || !dash}
    <div class="card border-red-200 bg-red-50 text-red-700">Gagal memuat data: {data.error}</div>
  {:else}
    <!-- Peringatan terlambat -->
    {#if up && up.overdueCount > 0}
      <a
        href="#jadwal"
        class="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
      >
        <span class="font-semibold">⚠ {up.overdueCount} pekerjaan sudah lewat jatuh tempo</span>
        <span class="text-sm underline">Lihat</span>
      </a>
    {/if}

    <!-- Pintasan -->
    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each shortcuts as s}
        <a
          href={s.href}
          class="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 font-medium text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
        >
          <span class="text-2xl">{s.icon}</span>{s.label}
        </a>
      {/each}
    </div>

    <!-- Kartu ringkasan -->
    <div class="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-brand-50 p-4">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">💵</span>
          <p class="text-sm text-gray-600">Pemasukan bulan ini</p>
        </div>
        <p class="mt-3 text-2xl font-bold text-brand-800 tabular-nums">{rupiah(dash.cards.incomeThisMonth)}</p>
        <p class="mt-1 text-xs">
          {#if delta !== null}
            <span class="font-semibold {delta >= 0 ? 'text-green-700' : 'text-red-600'}">
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
            </span>
            <span class="text-gray-500">dibanding bulan lalu</span>
          {:else if cur > 0}
            <span class="text-gray-500">Belum ada pemasukan bulan lalu</span>
          {:else}
            <span class="text-gray-500">Belum ada pemasukan</span>
          {/if}
        </p>
      </div>

      <a href="/orders?unpaid=1" class="rounded-2xl bg-amber-50 p-4 transition hover:bg-amber-100">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">🧾</span>
          <p class="text-sm text-gray-600">Sisa tagihan</p>
        </div>
        <p class="mt-3 text-2xl font-bold text-amber-700 tabular-nums">{rupiah(dash.cards.outstanding)}</p>
        <p class="mt-1 text-xs text-gray-500">{dash.unpaid.count} order belum lunas · lihat →</p>
      </a>

      <a href="/orders?status=dikerjakan" class="rounded-2xl bg-purple-50 p-4 transition hover:bg-purple-100">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">🔨</span>
          <p class="text-sm text-gray-600">Sedang dikerjakan</p>
        </div>
        <p class="mt-3 text-2xl font-bold text-purple-700">{dash.cards.activeOrders} order</p>
        <p class="mt-1 text-xs text-gray-500">Lihat daftarnya →</p>
      </a>

      <a href="/orders?status=penawaran" class="rounded-2xl bg-gray-100 p-4 transition hover:bg-gray-200">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl">⏳</span>
          <p class="text-sm text-gray-600">Menunggu keputusan</p>
        </div>
        <p class="mt-3 text-2xl font-bold text-gray-700">{dash.cards.pendingOrders} order</p>
        <p class="mt-1 text-xs text-gray-500">Lihat penawaran →</p>
      </a>
    </div>

    <!-- Jadwal dan jatuh tempo -->
    {#if up}
      <section id="jadwal" class="mb-5">
        {#if up.items.length === 0}
          <div class="rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
            📅 Belum ada pekerjaan yang punya jatuh tempo. Isi jadwal di halaman detail order.
          </div>
        {:else}
          <div class="card">
            <h2 class="mb-3 flex flex-wrap items-center gap-2 text-lg font-semibold">
              Jadwal dan jatuh tempo
              {#if up.overdueCount > 0}
                <span class="rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700">{up.overdueCount} terlambat</span>
              {/if}
              {#if up.soonCount > 0}
                <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm text-amber-800">{up.soonCount} dalam 7 hari</span>
              {/if}
            </h2>
            <ul class="grid gap-2 md:grid-cols-2">
              {#each up.items as o (o.id)}
                {@const d = dueInfo(o.daysLeft)}
                <li>
                  <a href="/orders/{o.id}" class="block rounded-xl border border-gray-100 p-3 transition hover:bg-brand-50">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-semibold">{o.title}</span>
                      <span class="rounded-full px-3 py-0.5 text-xs font-semibold {d.cls}">{d.text}</span>
                    </div>
                    <p class="text-sm text-gray-500">{o.orderNumber} · {o.customerName}</p>
                    <p class="mt-1 flex items-center gap-2 text-sm">
                      Jatuh tempo <strong>{tgl(o.dueDate)}</strong>
                      <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold {badge[o.status]}">
                        <span class="h-1.5 w-1.5 rounded-full {dot[o.status]}"></span>{label[o.status]}
                      </span>
                    </p>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/if}

    <!-- Perlu perhatian -->
    <div class="mb-5 grid items-start gap-4 lg:grid-cols-2">
      <section class="card">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
          Margin tipis atau rugi
          {#if dash.lowMargin.count > 0}
            <span class="rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700">{dash.lowMargin.count}</span>
          {/if}
        </h2>
        {#if dash.lowMargin.items.length === 0}
          <p class="rounded-xl bg-green-50 p-3 text-green-700">✓ Semua order aman, tidak ada margin tipis.</p>
        {:else}
          <ul class="grid gap-2">
            {#each dash.lowMargin.items as o (o.id)}
              <li>
                <a href="/orders/{o.id}" class="block rounded-xl border border-gray-100 p-3 transition hover:bg-brand-50">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-semibold">{o.title}</span>
                    <span
                      class="rounded-full px-2.5 py-0.5 text-xs font-semibold {o.level === 'rugi'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'}"
                    >
                      {o.level === 'rugi' ? 'Rugi' : 'Tipis'}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">{o.orderNumber} · {o.customerName}</p>
                  <p class="mt-1 text-sm">
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

      <section class="card">
        <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
          Sisa tagihan terbesar
          {#if dash.unpaid.count > 0}
            <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm text-amber-700">{dash.unpaid.count}</span>
          {/if}
        </h2>
        {#if dash.unpaid.items.length === 0}
          <p class="rounded-xl bg-green-50 p-3 text-green-700">✓ Semua tagihan sudah lunas.</p>
        {:else}
          <ul class="grid gap-2">
            {#each dash.unpaid.items as o (o.id)}
              <li>
                <a href="/orders/{o.id}/pembayaran" class="block rounded-xl border border-gray-100 p-3 transition hover:bg-brand-50">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-semibold">{o.title}</span>
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold {badge[o.status]}">
                      <span class="h-1.5 w-1.5 rounded-full {dot[o.status]}"></span>{label[o.status]}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">{o.orderNumber} · {o.customerName}</p>
                  <p class="mt-1 text-sm">
                    Sisa <strong class="text-amber-700">{rupiah(o.remaining)}</strong>
                    <span class="text-gray-500">dari {rupiah(o.agreedPrice)}</span>
                  </p>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    <!-- Grafik dan order terbaru -->
    <div class="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
      <section class="card">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold">Pemasukan 6 bulan terakhir</h2>
          <span class="text-sm text-gray-500">Total <strong class="text-gray-800">{rupiah(total6)}</strong></span>
        </div>
        <div class="flex items-end gap-2 sm:gap-3">
          {#each dash.incomeByMonth as m (m.month)}
            <div class="flex flex-1 flex-col items-center justify-end" title={rupiah(m.total)}>
              <span class="mb-1 h-4 text-xs text-gray-500">{m.total > 0 ? ringkas(m.total) : ''}</span>
              <div class="flex h-40 w-full items-end">
                <div
                  class="w-full rounded-t-lg {m.month === dash.thisMonth ? 'bg-brand-600' : 'bg-brand-200'}"
                  style="height: {Math.max((m.total / maxIncome) * 160, m.total > 0 ? 6 : 2)}px"
                ></div>
              </div>
              <span class="mt-2 text-xs {m.month === dash.thisMonth ? 'font-bold text-brand-700' : 'text-gray-500'}">
                {labelBulan(m.month)}
              </span>
            </div>
          {/each}
        </div>
      </section>

      <section class="card">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Order terbaru</h2>
          <a href="/orders" class="text-sm font-semibold text-brand-600">Lihat semua →</a>
        </div>
        {#if dash.recent.length === 0}
          <p class="text-gray-500">Belum ada order.</p>
        {:else}
          <ul class="divide-y divide-gray-100">
            {#each dash.recent as o (o.id)}
              <li>
                <a href="/orders/{o.id}" class="flex items-center justify-between gap-3 py-2.5 transition hover:bg-brand-50">
                  <div class="min-w-0">
                    <div class="truncate font-medium">{o.title}</div>
                    <div class="truncate text-xs text-gray-500">{o.orderNumber} · {o.customerName}</div>
                  </div>
                  <div class="shrink-0 text-right">
                    <div class="text-sm font-semibold tabular-nums">
                      {o.offeredPrice !== null ? rupiah(o.offeredPrice) : '-'}
                    </div>
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold {badge[o.status]}">
                      <span class="h-1.5 w-1.5 rounded-full {dot[o.status]}"></span>{label[o.status]}
                    </span>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  {/if}
</main>