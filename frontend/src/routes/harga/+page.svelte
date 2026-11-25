<script lang="ts">
  import PriceRow from '../../lib/components/PriceRow.svelte';

  let { data } = $props();
  const p = $derived(data.p);

  let tab = $state('profil');

  const statusOpts = [
    { value: 'belum_diverifikasi', label: 'Belum diverifikasi' },
    { value: 'terverifikasi', label: 'Terverifikasi' },
  ];
  const seriesOpts = [
    { value: '3', label: '3 inci' },
    { value: '4', label: '4 inci' },
  ];
  const kindOpts = [
    { value: 'flat', label: 'Tetap per pekerjaan' },
    { value: 'per_unit', label: 'Per unit' },
    { value: 'percent', label: '% dari modal' },
  ];
  const activeOpts = [
    { value: 'true', label: 'Dipakai' },
    { value: 'false', label: 'Mati' },
  ];

  const settingInfo: Record<string, { label: string; suffix: string }> = {
    bar_length_m: { label: 'Panjang satu batang profil', suffix: 'm' },
    waste_standard_pct: { label: 'Sisa potongan, pekerjaan standar', suffix: '%' },
    waste_complex_pct: { label: 'Sisa potongan, pekerjaan rumit', suffix: '%' },
    markup_standard_pct: { label: 'Markup standar', suffix: '% dari modal' },
    markup_min_pct: { label: 'Markup minimum', suffix: '% dari modal' },
    markup_premium_pct: { label: 'Markup premium', suffix: '% dari modal' },
    glass_min_m2: { label: 'Minimal luas kaca yang ditagih', suffix: 'm²' },
  };

  const tabs = $derived([
    { id: 'profil', label: 'Profil', count: p.profilePrices.length + p.profileTypes.length },
    { id: 'kaca', label: 'Kaca', count: p.glasses.length },
    { id: 'aksesoris', label: 'Aksesoris', count: p.accessories.length },
    { id: 'upah', label: 'Upah & minimum', count: p.products.length },
    { id: 'lain', label: 'Lain-lain', count: p.settings.length + p.finishings.length + p.overheads.length },
  ]);

  // Harga yang belum dicek ke toko atau pemasok
  const unverified = $derived(
    [...p.profilePrices, ...p.glasses, ...p.accessories, ...p.products].filter(
      (r: any) => r.status === 'belum_diverifikasi'
    ).length
  );

  const addBtn =
    'cursor-pointer list-none rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100/50';
</script>

{#snippet head(title: string, desc?: string)}
  <div class="mb-2 px-3">
    <h2 class="text-lg font-semibold text-brand-900">{title}</h2>
    {#if desc}<p class="text-sm text-gray-500">{desc}</p>{/if}
  </div>
{/snippet}

<div class="mx-auto max-w-6xl p-4 md:p-6">
  <h1 class="page-title">Harga & Pengaturan</h1>
  <p class="mb-4 text-sm text-gray-600">
    Harga di sini dipakai Kalkulator. Order yang sudah dibuat tidak ikut berubah.
  </p>

  {#if unverified > 0}
    <p class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <strong>{unverified} harga</strong> belum diverifikasi. Ubah statusnya ke "Terverifikasi" setelah dicek ke
      toko atau pemasok.
    </p>
  {:else}
    <p class="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      Semua harga sudah terverifikasi.
    </p>
  {/if}

  <!-- Tab -->
  <nav class="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200">
    {#each tabs as t (t.id)}
      <button
        type="button"
        class="-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition {tab === t.id
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-gray-500 hover:text-brand-700'}"
        onclick={() => (tab = t.id)}
      >
        {t.label}
        <span
          class="rounded-full px-2 py-0.5 text-xs {tab === t.id
            ? 'bg-brand-100 text-brand-700'
            : 'bg-gray-100 text-gray-500'}"
        >
          {t.count}
        </span>
      </button>
    {/each}
  </nav>

  {#if tab === 'profil'}
    <div class="card mb-4">
      {@render head('Harga profil per meter lari', 'Per merk dan seri. Dipakai semua jenis profil di seri itu.')}
      {#each p.profilePrices as r (r.id)}
        <PriceRow
          kind="profile-price"
          id={r.id}
          fields={[
            { key: 'brand', label: 'Merk', type: 'text', value: r.brand },
            { key: 'series', label: 'Seri', type: 'select', value: r.series, options: seriesOpts },
            { key: 'pricePerMeter', label: 'Harga per meter', type: 'money', value: r.pricePerMeter },
            { key: 'status', label: 'Status', type: 'select', value: r.status, options: statusOpts },
          ]}
        />
      {/each}
      <details class="mt-3">
        <summary class={addBtn}>+ Tambah merk</summary>
        <PriceRow
          kind="profile-price"
          action="tambah"
          submitLabel="Tambah"
          fields={[
            { key: 'brand', label: 'Merk', type: 'text', value: '', placeholder: 'mis. Alcom' },
            { key: 'series', label: 'Seri', type: 'select', value: '3', options: seriesOpts },
            { key: 'pricePerMeter', label: 'Harga per meter', type: 'money', value: '' },
          ]}
        />
      </details>
    </div>

    <div class="card">
      {@render head(
        'Harga khusus per jenis profil',
        'Kosongkan untuk ikut harga seri di atas. Isi kalau jenis profil ini punya harga sendiri (berlaku untuk semua merk).'
      )}
      {#each p.profileTypes as r (r.id)}
        <PriceRow
          kind="profile-type"
          id={r.id}
          fields={[
            { key: 'code', label: 'Kode', type: 'info', value: r.code },
            { key: 'name', label: 'Nama', type: 'text', value: r.name, wide: true },
            { key: 'priceOverride', label: 'Harga khusus per meter', type: 'money', value: r.priceOverride, placeholder: 'ikut seri' },
          ]}
        />
      {/each}
    </div>
  {/if}

  {#if tab === 'kaca'}
    <div class="card">
      {@render head('Harga kaca per m²')}
      {#each p.glasses as r (r.id)}
        <PriceRow
          kind="glass"
          id={r.id}
          fields={[
            { key: 'name', label: 'Jenis', type: 'text', value: r.name, wide: true },
            { key: 'thicknessMm', label: 'Tebal', type: 'number', value: r.thicknessMm, suffix: 'mm' },
            { key: 'pricePerM2', label: 'Harga per m²', type: 'money', value: r.pricePerM2 },
            { key: 'status', label: 'Status', type: 'select', value: r.status, options: statusOpts },
          ]}
        />
      {/each}
      <details class="mt-3">
        <summary class={addBtn}>+ Tambah jenis kaca</summary>
        <PriceRow
          kind="glass"
          action="tambah"
          submitLabel="Tambah"
          fields={[
            { key: 'name', label: 'Jenis', type: 'text', value: '', wide: true, placeholder: 'mis. Laminated' },
            { key: 'thicknessMm', label: 'Tebal', type: 'number', value: '', suffix: 'mm' },
            { key: 'pricePerM2', label: 'Harga per m²', type: 'money', value: '' },
          ]}
        />
      </details>
    </div>
  {/if}

  {#if tab === 'aksesoris'}
    <div class="card">
      {@render head('Harga aksesoris dan bahan habis')}
      {#each p.accessories as r (r.id)}
        <PriceRow
          kind="accessory"
          id={r.id}
          fields={[
            { key: 'code', label: 'Kode', type: 'info', value: r.code },
            { key: 'name', label: 'Nama', type: 'text', value: r.name, wide: true },
            { key: 'unit', label: 'Satuan', type: 'text', value: r.unit },
            { key: 'price', label: 'Harga satuan', type: 'money', value: r.price },
            { key: 'status', label: 'Status', type: 'select', value: r.status, options: statusOpts },
          ]}
        />
      {/each}
      <details class="mt-3">
        <summary class={addBtn}>+ Tambah aksesoris</summary>
        <p class="px-3 pt-2 text-xs text-gray-500">
          Aksesoris baru baru dipakai kalkulator setelah dipasang ke resep produk (menu Resep).
        </p>
        <PriceRow
          kind="accessory"
          action="tambah"
          submitLabel="Tambah"
          fields={[
            { key: 'code', label: 'Kode', type: 'text', value: '', placeholder: 'HURUF_BESAR_DAN_ANGKA' },
            { key: 'name', label: 'Nama', type: 'text', value: '', wide: true },
            { key: 'unit', label: 'Satuan', type: 'text', value: '', placeholder: 'buah / set / m' },
            { key: 'price', label: 'Harga satuan', type: 'money', value: '' },
          ]}
        />
      </details>
    </div>
  {/if}

  {#if tab === 'upah'}
    <div class="card">
      {@render head('Upah dan harga minimum per produk', 'Per unit. Harga jual tidak akan turun di bawah harga minimum.')}
      {#each p.products as r (r.id)}
        <PriceRow
          kind="product"
          id={r.id}
          fields={[
            { key: 'name', label: 'Produk', type: 'info', value: r.name },
            { key: 'buildLabor', label: 'Upah pembuatan', type: 'money', value: r.buildLabor },
            { key: 'installLabor', label: 'Upah pemasangan', type: 'money', value: r.installLabor },
            { key: 'minPrice', label: 'Harga minimum', type: 'money', value: r.minPrice },
            { key: 'status', label: 'Status', type: 'select', value: r.status, options: statusOpts },
          ]}
        />
      {/each}
    </div>
  {/if}

  {#if tab === 'lain'}
    <div class="card mb-4">
      {@render head('Pengaturan umum')}
      {#each p.settings as r (r.id)}
        <PriceRow
          kind="setting"
          id={r.id}
          fields={[
            { key: 'key', label: 'Pengaturan', type: 'info', value: settingInfo[r.key]?.label ?? r.key, wide: true },
            { key: 'value', label: 'Nilai', type: 'number', value: r.value, suffix: settingInfo[r.key]?.suffix },
          ]}
        />
      {/each}
    </div>

    <div class="card mb-4">
      {@render head('Tambahan warna / finishing', 'Persen tambahan dari biaya profil.')}
      {#each p.finishings as r (r.id)}
        <PriceRow
          kind="finishing"
          id={r.id}
          fields={[
            { key: 'name', label: 'Nama', type: 'text', value: r.name, wide: true },
            { key: 'percent', label: 'Tambahan', type: 'number', value: r.percent, suffix: '%' },
          ]}
        />
      {/each}
      <details class="mt-3">
        <summary class={addBtn}>+ Tambah finishing</summary>
        <PriceRow
          kind="finishing"
          action="tambah"
          submitLabel="Tambah"
          fields={[
            { key: 'name', label: 'Nama', type: 'text', value: '', wide: true },
            { key: 'percent', label: 'Tambahan', type: 'number', value: '', suffix: '%' },
          ]}
        />
      </details>
    </div>

    <div class="card">
      {@render head(
        'Biaya lain',
        'Tetap per pekerjaan (mis. ongkir), per unit (mis. bahan habis), atau persen dari modal (biaya tak terduga).'
      )}
      {#each p.overheads as r (r.id)}
        <PriceRow
          kind="overhead"
          id={r.id}
          fields={[
            { key: 'name', label: 'Nama', type: 'text', value: r.name, wide: true },
            { key: 'kind', label: 'Jenis', type: 'select', value: r.kind, options: kindOpts },
            { key: 'amount', label: 'Jumlah', type: 'number', value: r.amount },
            { key: 'enabled', label: 'Status', type: 'bool', value: r.enabled, options: activeOpts },
          ]}
        />
      {/each}
      <details class="mt-3">
        <summary class={addBtn}>+ Tambah biaya lain</summary>
        <PriceRow
          kind="overhead"
          action="tambah"
          submitLabel="Tambah"
          fields={[
            { key: 'name', label: 'Nama', type: 'text', value: '', wide: true },
            { key: 'kind', label: 'Jenis', type: 'select', value: 'flat', options: kindOpts },
            { key: 'amount', label: 'Jumlah', type: 'number', value: '' },
            { key: 'enabled', label: 'Status', type: 'bool', value: true, options: activeOpts },
          ]}
        />
      </details>
    </div>
  {/if}
</div>