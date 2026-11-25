<script lang="ts">
  import { enhance } from '$app/forms';
  import { rupiah } from '../../lib/api';
  import MoneyInput from '../../lib/components/MoneyInput.svelte';

  let { data, form } = $props();

  // Harga di form tambah, dan penanda form sedang dikirim (mencegah kiriman ganda)
  let newPrice = $state(0);
  let submitting = $state(false);

  // Filter kategori (di browser) dan baris yang sedang diubah harganya
  let cat = $state('');
  let editing: string | null = $state(null);

  const catKey = (s: string) => (s ?? '').trim().toLowerCase();
  const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // Kategori digabung tanpa membedakan huruf besar/kecil
  const categories = $derived.by(() => {
    const map = new Map<string, number>();
    for (const m of data.materials) {
      const k = catKey(m.category);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ key, count }));
  });

  // Kalau kategori terpilih hilang (mis. setelah mencari), kembali ke Semua
  const activeCat = $derived(categories.some((c) => c.key === cat) ? cat : '');
  const items = $derived(
    activeCat ? data.materials.filter((m: any) => catKey(m.category) === activeCat) : data.materials
  );

  const catBadge = (k: string) =>
    k === 'profil'
      ? 'bg-brand-100 text-brand-700'
      : k === 'kaca'
        ? 'bg-sky-100 text-sky-700'
        : k === 'aksesoris'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-700';

  // Alamat untuk tombol "Tampilkan nonaktif", pencarian ikut terbawa
  const hrefInactive = $derived.by(() => {
    const q = new URLSearchParams();
    if (data.search) q.set('search', data.search);
    if (!data.showInactive) q.set('nonaktif', '1');
    const s = q.toString();
    return s ? `/materials?${s}` : '/materials';
  });

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'
    }`;
</script>

<!-- Tombol aksi per baris, dipakai di tabel dan kartu HP -->
{#snippet rowActions(m: any)}
  {#if editing === m.id}
    <form
      method="POST"
      action="?/update"
      class="flex flex-wrap items-center gap-2"
      use:enhance={() =>
        async ({ result, update }) => {
          await update();
          if (result.type === 'success') editing = null;
        }}
    >
      <input type="hidden" name="id" value={m.id} />
      <MoneyInput name="price" required placeholder="Harga baru" class="w-44" />
      <button class="btn">Simpan</button>
      <button type="button" class="text-sm text-gray-500 underline" onclick={() => (editing = null)}>
        Batal
      </button>
    </form>
  {:else}
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        onclick={() => (editing = m.id)}
      >
        Ubah harga
      </button>
      {#if m.isActive}
        <form
          method="POST"
          action="?/deactivate"
          use:enhance={({ cancel }) => {
            if (!confirm('Nonaktifkan material ini? Riwayat order lama tetap aman.')) cancel();
          }}
        >
          <input type="hidden" name="id" value={m.id} />
          <button class="text-sm font-medium text-red-600 hover:underline">Nonaktifkan</button>
        </form>
      {:else}
        <form method="POST" action="?/activate" use:enhance>
          <input type="hidden" name="id" value={m.id} />
          <button
            class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            Aktifkan
          </button>
        </form>
      {/if}
    </div>
  {/if}
{/snippet}

<main class="mx-auto max-w-6xl p-4 md:p-6">
  <!-- Judul -->
  <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Katalog Material</h1>
      <p class="text-sm text-gray-500">
        Harga di sini dipakai saat membuat order manual. Harga untuk Kalkulator diatur di halaman
        <a href="/harga" class="font-semibold text-brand-600 underline">Harga</a>.
      </p>
    </div>
    <a
      href="/materials/harga-massal"
      class="rounded-full border border-brand-300 px-5 py-2 font-medium text-brand-700 transition hover:bg-brand-100"
    >
      Ubah harga massal
    </a>
  </div>

  {#if form?.messages}
    <ul class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
      {#each form.messages as m}
        <li>{m}</li>
      {/each}
    </ul>
  {/if}
  {#if form?.success}
    <p class="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">{form.message}</p>
  {/if}

  <!-- Tambah material -->
  <details class="card mb-4" open={!!form?.messages}>
    <summary class="cursor-pointer font-semibold text-brand-700">+ Tambah material baru</summary>

    <form
      method="POST"
      action="?/create"
      class="mt-4 grid gap-3 sm:grid-cols-2"
      use:enhance={() => {
        submitting = true;
        return async ({ result, update }) => {
          await update();
          if (result.type === 'success') newPrice = 0;
          submitting = false;
        };
      }}
    >
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs text-gray-500">Nama</span>
        <input name="name" placeholder="mis. Profil 4 in YKK 1,2 mm" required class="field" />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">Kategori</span>
        <input name="category" list="kategori-list" placeholder="profil, kaca, aksesoris" required class="field" />
        <datalist id="kategori-list">
          {#each categories as c}<option value={titleCase(c.key)}></option>{/each}
        </datalist>
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">Merk (opsional)</span>
        <input name="brand" placeholder="mis. YKK" class="field" />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">Satuan</span>
        <input name="unit" placeholder="meter, m2, pcs" required class="field" />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">Harga per satuan</span>
        <MoneyInput name="price" bind:value={newPrice} placeholder="Harga per satuan" required />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs text-gray-500">Panjang 1 batang (meter, opsional)</span>
        <input name="lengthPerUnit" type="number" min="0" step="0.01" placeholder="mis. 6" class="field" />
      </label>
      <button disabled={submitting} class="btn sm:col-span-2">
        {submitting ? 'Menyimpan...' : 'Simpan material'}
      </button>
    </form>
  </details>

  <!-- Pencarian -->
  <form method="GET" class="mb-3 flex gap-2">
    {#if data.showInactive}<input type="hidden" name="nonaktif" value="1" />{/if}
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
      <input name="search" value={data.search} placeholder="Cari nama material" class="field pl-10" />
    </div>
    <button class="btn">Cari</button>
  </form>

  <!-- Filter kategori -->
  {#if categories.length > 0}
    <div class="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      <button type="button" class={pill(activeCat === '')} onclick={() => (cat = '')}>
        Semua ({data.materials.length})
      </button>
      {#each categories as c}
        <button type="button" class={pill(activeCat === c.key)} onclick={() => (cat = c.key)}>
          {titleCase(c.key)} ({c.count})
        </button>
      {/each}
      <span class="mx-1 hidden w-px shrink-0 bg-gray-200 md:block"></span>
      <a href={hrefInactive} class={pill(data.showInactive)}>
        {data.showInactive ? '✓ ' : ''}Tampilkan nonaktif
      </a>
    </div>
  {:else}
    <div class="mb-4">
      <a href={hrefInactive} class={pill(data.showInactive)}>
        {data.showInactive ? '✓ ' : ''}Tampilkan nonaktif
      </a>
    </div>
  {/if}

  {#if data.error}
    <div class="card border-red-200 bg-red-50 text-red-700">Gagal memuat data: {data.error}</div>
  {:else if data.materials.length === 0}
    <div class="card py-10 text-center">
      <div class="text-4xl">📦</div>
      <p class="mt-2 font-medium">
        {data.search ? 'Tidak ada material yang cocok' : 'Belum ada material'}
      </p>
      {#if data.search}
        <a href="/materials" class="mt-1 inline-block font-semibold text-brand-600 underline">Hapus pencarian</a>
      {/if}
    </div>
  {:else}
    <p class="mb-2 text-sm text-gray-500">{items.length} material</p>

    <!-- Tabel (layar lebar) -->
    <div class="card hidden overflow-hidden p-0 md:block">
      <table class="tbl w-full">
        <thead>
          <tr>
            <th>Material</th>
            <th class="text-right">Harga</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <!-- Kunci memuat harga dan status, supaya tampilan ikut segar setelah disimpan -->
          {#each items as m (m.id + m.price + m.isActive)}
            <tr class={m.isActive ? '' : 'bg-gray-50 text-gray-400'}>
              <td>
                <div class="flex flex-wrap items-center gap-2">
                  <a
                    href="/materials/{m.id}"
                    class="font-semibold hover:underline {m.isActive ? 'text-brand-700' : 'text-gray-500'}"
                  >
                    {m.name}
                  </a>
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium {catBadge(catKey(m.category))}">
                    {titleCase(catKey(m.category))}
                  </span>
                  {#if !m.isActive}
                    <span class="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs text-gray-600">Nonaktif</span>
                  {/if}
                </div>
                <div class="text-xs text-gray-500">{m.brand ? `${m.brand} · ` : ''}per {m.unit}</div>
              </td>
              <td class="text-right whitespace-nowrap tabular-nums">
                <span class="font-semibold">{rupiah(m.price)}</span>
                <span class="text-xs text-gray-500">/ {m.unit}</span>
              </td>
              <td>{@render rowActions(m)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Kartu (HP) -->
    <div class="space-y-3 md:hidden">
      {#each items as m (m.id + m.price + m.isActive)}
        <div class="card {m.isActive ? '' : 'bg-gray-50'}">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium {catBadge(catKey(m.category))}">
              {titleCase(catKey(m.category))}
            </span>
            {#if !m.isActive}
              <span class="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs text-gray-600">Nonaktif</span>
            {/if}
          </div>
          <a href="/materials/{m.id}" class="mt-1 block font-semibold text-brand-700">{m.name}</a>
          <div class="text-xs text-gray-500">{m.brand ? `${m.brand} · ` : ''}per {m.unit}</div>
          <div class="mt-2 text-lg font-bold tabular-nums">
            {rupiah(m.price)} <span class="text-sm font-normal text-gray-500">/ {m.unit}</span>
          </div>
          <div class="mt-3 border-t border-gray-100 pt-3">{@render rowActions(m)}</div>
        </div>
      {/each}
    </div>
  {/if}
</main>