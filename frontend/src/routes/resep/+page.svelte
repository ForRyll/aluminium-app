<script lang="ts">
  import { enhance } from '$app/forms';
  import PriceRow from '../../lib/components/PriceRow.svelte';

  let { data } = $props();
  const r = $derived(data.recipe);

  // Daftar potong
  let L = $state(120);
  let T = $state(100);
  let S = $state(1);
  let pv: any = $state(null);
  let pvError = $state('');
  let pvLoading = $state(false);

  let showNew = $state(false);

  const typeOpts = $derived(
    (r?.profileTypes ?? []).map((t: any) => ({ value: t.code, label: `${t.name} (${t.series} in)` }))
  );
  const accOpts = $derived((r?.accessories ?? []).map((a: any) => ({ value: a.code, label: a.name })));
  const accName = $derived(new Map((r?.accessories ?? []).map((a: any) => [a.code, a.name])));
  const optionalOpts = [
    { value: 'false', label: 'Wajib' },
    { value: 'true', label: 'Opsional' },
  ];
</script>

<div class="p-4 md:p-6">
  <h1 class="page-title">Resep Produk</h1>
  <p class="mb-4 text-sm opacity-70">
    Atur potongan profil, kaca, dan aksesoris tiap produk. Rumus yang salah akan ditolak saat disimpan.
    Cek hasilnya di Daftar potong, lalu cocokkan dengan hitungan bapak.
  </p>

  <div class="mb-4 flex flex-wrap items-center gap-2">
    {#each data.products as p}
      <a
        href={`/resep?p=${p.code}`}
        class="rounded-full border px-5 py-2 font-medium transition {data.code === p.code
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'}"
      >
        {p.name}
      </a>
    {/each}
    <button
      type="button"
      class="rounded-full border border-dashed border-brand-300 px-5 py-2 font-medium text-brand-700 hover:bg-brand-100"
      onclick={() => (showNew = !showNew)}
    >
      + Produk baru
    </button>
  </div>

  {#if showNew}
    <div class="card mb-4">
      <h2 class="font-semibold">Produk baru</h2>
      <p class="mb-1 text-sm opacity-70">
        Produk belum bisa dihapus setelah dibuat, jadi isi dengan produk yang benar-benar dipakai.
        Kode: huruf besar, angka, dan garis bawah (mis. KANOPI_BAJA_RINGAN).
      </p>
      <PriceRow
        kind="product"
        action="tambah"
        submitLabel="Buat produk"
        fields={[
          { key: 'code', label: 'Kode', type: 'text', value: '', placeholder: 'KANOPI_ALUMINIUM' },
          { key: 'name', label: 'Nama produk', type: 'text', value: '', wide: true },
          { key: 'glassWidthFormula', label: 'Rumus lebar kaca (opsional)', type: 'text', value: '', placeholder: 'L - 25' },
          { key: 'glassHeightFormula', label: 'Rumus tinggi kaca (opsional)', type: 'text', value: '', placeholder: 'T - 8' },
        ]}
      />
    </div>
  {/if}

  {#if r}
    <div class="grid gap-4 xl:grid-cols-[1fr_400px]">
      <div class="space-y-4">
        <!-- Info produk -->
        <div class="card">
          <h2 class="font-semibold">Produk</h2>
          <p class="mb-1 text-sm opacity-70">
            Rumus kaca dihitung per bidang kaca. Jumlah bidang sama dengan jumlah daun. Kosongkan dua-duanya
            kalau produk tanpa kaca. Upah dan harga minimum diatur di halaman Harga.
          </p>
          {#key data.code}
            <PriceRow
              kind="product"
              id={r.product.id}
              fields={[
                { key: 'name', label: 'Nama produk', type: 'text', value: r.product.name, wide: true },
                { key: 'glassWidthFormula', label: 'Rumus lebar kaca', type: 'text', value: r.product.glassWidthFormula ?? '', placeholder: 'tanpa kaca' },
                { key: 'glassHeightFormula', label: 'Rumus tinggi kaca', type: 'text', value: r.product.glassHeightFormula ?? '', placeholder: 'tanpa kaca' },
              ]}
            />
          {/key}
        </div>

        <!-- Potongan profil -->
        <div class="card">
          <h2 class="font-semibold">Potongan profil</h2>
          <p class="mb-1 text-sm opacity-70">
            Panjang dalam cm. Variabel: <b>L</b> lebar, <b>T</b> tinggi, <b>S</b> jumlah daun. Operator: + - * / dan kurung.
            Contoh: <code>(L / S) - 8</code>
          </p>
          {#each r.components as c (c.id)}
            <PriceRow
              kind="component"
              id={c.id}
              deletable
              fields={[
                { key: 'name', label: 'Nama potongan', type: 'text', value: c.name, wide: true },
                { key: 'profileTypeCode', label: 'Jenis profil', type: 'select', value: c.profileTypeCode, options: typeOpts },
                { key: 'lengthFormula', label: 'Panjang (cm)', type: 'text', value: c.lengthFormula },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: c.qtyFormula },
                { key: 'sortOrder', label: 'Urutan', type: 'number', value: c.sortOrder },
              ]}
            />
          {/each}
          {#if r.components.length === 0}
            <p class="py-3 text-sm opacity-60">Belum ada potongan.</p>
          {/if}

          <h3 class="mt-4 text-sm font-semibold">Tambah potongan</h3>
          <PriceRow
            kind="component"
            action="tambah"
            submitLabel="Tambah"
            extra={{ productCode: r.product.code }}
            fields={[
              { key: 'name', label: 'Nama potongan', type: 'text', value: '', wide: true, placeholder: 'mis. Kusen atas' },
              { key: 'profileTypeCode', label: 'Jenis profil', type: 'select', value: typeOpts[0]?.value ?? '', options: typeOpts },
              { key: 'lengthFormula', label: 'Panjang (cm)', type: 'text', value: '', placeholder: 'L - 8' },
              { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: '1' },
            ]}
          />
        </div>

        <!-- Aksesoris -->
        <div class="card">
          <h2 class="font-semibold">Aksesoris</h2>
          <p class="mb-1 text-sm opacity-70">
            Selain L, T, S, rumus jumlah juga boleh memakai <b>GW</b> (lebar kaca) dan <b>GH</b> (tinggi kaca), cm.
            Contoh karet kaca: <code>2 * (GW + GH) / 100 * S</code> (hasilnya meter).
          </p>
          {#each r.rules as a (a.id)}
            <PriceRow
              kind="rule"
              id={a.id}
              deletable
              fields={[
                { key: 'accessoryCode', label: 'Aksesoris', type: 'info', value: accName.get(a.accessoryCode) ?? a.accessoryCode, wide: true },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: a.qtyFormula },
                { key: 'optional', label: 'Sifat', type: 'bool', value: a.optional, options: optionalOpts },
              ]}
            />
          {/each}
          {#if r.rules.length === 0}
            <p class="py-3 text-sm opacity-60">Belum ada aksesoris.</p>
          {/if}

          <h3 class="mt-4 text-sm font-semibold">Tambah aksesoris ke resep</h3>
          <p class="text-xs opacity-60">Harga dan aksesoris baru diatur di halaman Harga, tab Aksesoris.</p>
          <PriceRow
            kind="rule"
            action="tambah"
            submitLabel="Tambah"
            extra={{ productCode: r.product.code }}
            fields={[
              { key: 'accessoryCode', label: 'Aksesoris', type: 'select', value: accOpts[0]?.value ?? '', options: accOpts, wide: true },
              { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: '1' },
              { key: 'optional', label: 'Sifat', type: 'bool', value: false, options: optionalOpts },
            ]}
          />
        </div>
      </div>

      <!-- Daftar potong -->
      <div class="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <div class="card">
          <h2 class="font-semibold">Daftar potong</h2>
          <p class="mb-2 text-sm opacity-70">Hasil rumus untuk ukuran tertentu. Simpan perubahan dulu, lalu tekan Lihat.</p>
          <form
            method="POST"
            action="?/preview"
            class="space-y-3"
            use:enhance={() => {
              pvLoading = true;
              pvError = '';
              return async ({ result, update }) => {
                await update({ reset: false });
                if (result.type === 'success' && (result.data as any)?.preview) {
                  pv = (result.data as any).preview;
                } else if (result.type === 'failure') {
                  pvError = (result.data as any)?.error ?? 'Gagal';
                }
                pvLoading = false;
              };
            }}
          >
            <input type="hidden" name="productCode" value={r.product.code} />
            <div class="grid grid-cols-3 gap-2">
              <label class="block"><span class="text-xs opacity-60">Lebar (cm)</span>
                <input name="L" type="number" min="10" step="any" class="field" bind:value={L} required /></label>
              <label class="block"><span class="text-xs opacity-60">Tinggi (cm)</span>
                <input name="T" type="number" min="10" step="any" class="field" bind:value={T} required /></label>
              <label class="block"><span class="text-xs opacity-60">Daun</span>
                <input name="S" type="number" min="1" max="10" class="field" bind:value={S} required /></label>
            </div>
            <button class="btn w-full" disabled={pvLoading}>{pvLoading ? 'Menghitung…' : 'Lihat daftar potong'}</button>
          </form>
          {#if pvError}<div class="mt-2 text-sm text-red-600">{pvError}</div>{/if}
        </div>

        {#if pv && pv.product.code === r.product.code}
          {#each pv.warnings as w}
            <div class="card text-amber-700">⚠ {w}</div>
          {/each}

          <div class="card overflow-x-auto">
            <h3 class="mb-2 font-semibold">Potongan profil</h3>
            <table class="tbl w-full text-sm">
              <thead><tr><th class="text-left">Potongan</th><th class="text-right">Panjang</th><th class="text-right">Jml</th></tr></thead>
              <tbody>
                {#each pv.cuts as c}
                  <tr>
                    <td>{c.name}<div class="text-xs opacity-60">{c.profile}</div></td>
                    <td class="text-right">{c.length} cm</td>
                    <td class="text-right">{c.qty}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <h4 class="mt-3 text-sm font-semibold">Total per jenis profil</h4>
            {#each pv.profileMeters as m}
              <div class="flex justify-between text-sm"><span>{m.profile}</span><span>{m.meters} m</span></div>
            {/each}
          </div>

          <div class="card text-sm">
            <h3 class="mb-1 font-semibold">Kaca</h3>
            {#if pv.glass}
              {pv.glass.width} x {pv.glass.height} cm, {pv.glass.pieces} bidang
            {:else}
              Produk ini tanpa kaca
            {/if}
          </div>

          <div class="card text-sm">
            <h3 class="mb-1 font-semibold">Aksesoris</h3>
            {#each pv.accessories as a}
              <div class="flex justify-between">
                <span>{a.name}{a.optional ? ' (opsional)' : ''}</span><span>{a.qty}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>