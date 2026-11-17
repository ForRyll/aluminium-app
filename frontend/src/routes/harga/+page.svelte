<script lang="ts">
  import PriceRow from '../../lib/components/PriceRow.svelte';

  let { data } = $props();
  const p = $derived(data.p);

  let tab = $state('profil');
  const tabs = [
    { id: 'profil', label: 'Profil' },
    { id: 'kaca', label: 'Kaca' },
    { id: 'aksesoris', label: 'Aksesoris' },
    { id: 'upah', label: 'Upah & minimum' },
    { id: 'lain', label: 'Lain-lain' },
  ];

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
</script>

<div class="p-4 md:p-6">
  <h1 class="page-title">Harga & Pengaturan</h1>
  <p class="mb-4 text-sm opacity-70">
    Harga di sini dipakai Kalkulator. Order yang sudah dibuat tidak ikut berubah. Ubah status ke
    "Terverifikasi" kalau harganya sudah dicek ke toko atau pemasok.
  </p>

    <div class="mb-4 flex flex-wrap gap-2">
    {#each tabs as t}
      <button
        type="button"
        class="rounded-full border px-5 py-2 font-medium transition {tab === t.id
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'}"
        onclick={() => (tab = t.id)}
      >
        {t.label}
      </button>
    {/each}
  </div>

  {#if tab === 'profil'}
    <div class="card mb-4">
      <h2 class="font-semibold">Harga profil per meter lari</h2>
      <p class="mb-2 text-sm opacity-70">Per merk dan seri. Dipakai semua jenis profil di seri itu.</p>
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
      <h3 class="mt-4 text-sm font-semibold">Tambah merk</h3>
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
    </div>

    <div class="card">
      <h2 class="font-semibold">Harga khusus per jenis profil</h2>
      <p class="mb-2 text-sm opacity-70">
        Kosongkan untuk ikut harga seri di atas. Isi kalau jenis profil ini punya harga sendiri
        (berlaku untuk semua merk).
      </p>
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
      <h2 class="font-semibold">Harga kaca per m²</h2>
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
      <h3 class="mt-4 text-sm font-semibold">Tambah jenis kaca</h3>
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
    </div>
  {/if}

  {#if tab === 'aksesoris'}
    <div class="card">
      <h2 class="font-semibold">Harga aksesoris dan bahan habis</h2>
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
      <h3 class="mt-4 text-sm font-semibold">Tambah aksesoris</h3>
      <p class="text-xs opacity-60">
        Aksesoris baru baru dipakai kalkulator setelah dipasang ke resep produk (menyusul).
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
    </div>
  {/if}

  {#if tab === 'upah'}
    <div class="card">
      <h2 class="font-semibold">Upah dan harga minimum per produk</h2>
      <p class="mb-2 text-sm opacity-70">Per unit. Harga jual tidak akan turun di bawah harga minimum.</p>
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
      <h2 class="font-semibold">Pengaturan umum</h2>
      {#each p.settings as r (r.id)}
        <PriceRow
          kind="setting"
          id={r.id}
          fields={[
            { key: 'key', label: 'Pengaturan', type: 'info', value: settingInfo[r.key]?.label ?? r.key },
            { key: 'value', label: 'Nilai', type: 'number', value: r.value, suffix: settingInfo[r.key]?.suffix },
          ]}
        />
      {/each}
    </div>

    <div class="card mb-4">
      <h2 class="font-semibold">Tambahan warna / finishing</h2>
      <p class="mb-2 text-sm opacity-70">Persen tambahan dari biaya profil.</p>
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
      <h3 class="mt-4 text-sm font-semibold">Tambah finishing</h3>
      <PriceRow
        kind="finishing"
        action="tambah"
        submitLabel="Tambah"
        fields={[
          { key: 'name', label: 'Nama', type: 'text', value: '', wide: true },
          { key: 'percent', label: 'Tambahan', type: 'number', value: '', suffix: '%' },
        ]}
      />
    </div>

    <div class="card">
      <h2 class="font-semibold">Biaya lain</h2>
      <p class="mb-2 text-sm opacity-70">
        Tetap per pekerjaan (mis. ongkir), per unit (mis. bahan habis), atau persen dari modal (biaya tak terduga).
      </p>
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
      <h3 class="mt-4 text-sm font-semibold">Tambah biaya lain</h3>
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
    </div>
  {/if}
</div>