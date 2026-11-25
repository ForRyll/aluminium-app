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

  const addBtn =
    'cursor-pointer list-none rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100/50';
</script>

{#snippet head(title: string, count?: number)}
  <div class="mb-2 flex items-center gap-2 px-3">
    <h2 class="text-lg font-semibold text-brand-900">{title}</h2>
    {#if count !== undefined}
      <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">{count}</span>
    {/if}
  </div>
{/snippet}

<div class="mx-auto max-w-7xl p-4 md:p-6">
  <h1 class="page-title">Resep Produk</h1>
  <p class="mb-4 text-sm text-gray-600">
    Atur potongan profil, kaca, dan aksesoris tiap produk. Rumus yang salah ditolak saat disimpan. Cek hasilnya di
    Daftar potong, lalu cocokkan dengan hitungan bapak.
  </p>

  <!-- Pilih produk -->
  <div class="mb-4 flex flex-wrap items-center gap-2">
    {#each data.products as p (p.code)}
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
      {showNew ? '× Tutup' : '+ Produk baru'}
    </button>
  </div>

  {#if showNew}
    <div class="card mb-4">
      {@render head('Produk baru')}
      <p class="mb-1 px-3 text-sm text-gray-500">
        Produk belum bisa dihapus setelah dibuat, jadi isi dengan produk yang benar-benar dipakai. Kode: huruf
        besar, angka, dan garis bawah (mis. KANOPI_BAJA_RINGAN).
      </p>
      <PriceRow
        kind="product"
        action="tambah"
        submitLabel="Buat produk"
        fields={[
          { key: 'code', label: 'Kode', type: 'text', value: '', placeholder: 'KANOPI_ALUMINIUM', width: 'w-56', mono: true },
          { key: 'name', label: 'Nama produk', type: 'text', value: '', wide: true },
          { key: 'glassWidthFormula', label: 'Rumus lebar kaca (opsional)', type: 'text', value: '', placeholder: 'L - 25', mono: true },
          { key: 'glassHeightFormula', label: 'Rumus tinggi kaca (opsional)', type: 'text', value: '', placeholder: 'T - 8', mono: true },
        ]}
      />
    </div>
  {/if}

  <!-- Cara menulis rumus -->
  <details class="mb-4 rounded-xl border border-brand-200 bg-brand-100/30">
    <summary class="cursor-pointer px-4 py-2.5 text-sm font-medium text-brand-700">Cara menulis rumus</summary>
    <div class="space-y-1 border-t border-brand-200 px-4 py-3 text-sm text-gray-700">
      <p>
        Ukuran dalam <b>cm</b>. Variabel: <b>L</b> lebar, <b>T</b> tinggi, <b>S</b> jumlah daun. Operator:
        <code>+ - * /</code> dan kurung.
      </p>
      <p>Contoh panjang potongan: <code class="font-mono">(L / S) - 8</code></p>
      <p>
        Khusus rumus jumlah aksesoris, boleh juga <b>GW</b> (lebar kaca) dan <b>GH</b> (tinggi kaca). Contoh karet
        kaca: <code class="font-mono">2 * (GW + GH) / 100 * S</code> (hasilnya meter).
      </p>
      <p>Rumus kaca dihitung per bidang. Jumlah bidang sama dengan jumlah daun. Kosongkan kalau produk tanpa kaca.</p>
    </div>
  </details>

  {#if r}
    <div class="grid items-start gap-4 xl:grid-cols-[1fr_400px]">
      <div class="space-y-4">
        <!-- Info produk -->
        <div class="card">
          {@render head('Produk')}
          {#key data.code}
            <PriceRow
              kind="product"
              id={r.product.id}
              fields={[
                { key: 'name', label: 'Nama produk', type: 'text', value: r.product.name, wide: true },
                { key: 'glassWidthFormula', label: 'Rumus lebar kaca', type: 'text', value: r.product.glassWidthFormula ?? '', placeholder: 'tanpa kaca', mono: true },
                { key: 'glassHeightFormula', label: 'Rumus tinggi kaca', type: 'text', value: r.product.glassHeightFormula ?? '', placeholder: 'tanpa kaca', mono: true },
              ]}
            />
          {/key}
          <p class="px-3 text-xs text-gray-500">Upah dan harga minimum diatur di halaman Harga.</p>
        </div>

        <!-- Potongan profil -->
        <div class="card">
          {@render head('Potongan profil', r.components.length)}
          {#each r.components as c (c.id)}
            <PriceRow
              kind="component"
              id={c.id}
              deletable
              fields={[
                { key: 'name', label: 'Nama potongan', type: 'text', value: c.name, wide: true },
                { key: 'profileTypeCode', label: 'Jenis profil', type: 'select', value: c.profileTypeCode, options: typeOpts, width: 'w-60' },
                { key: 'lengthFormula', label: 'Panjang (cm)', type: 'text', value: c.lengthFormula, width: 'w-36', mono: true },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: c.qtyFormula, width: 'w-28', mono: true },
                { key: 'sortOrder', label: 'Urutan', type: 'number', value: c.sortOrder, width: 'w-20' },
              ]}
            />
          {/each}
          {#if r.components.length === 0}
            <p class="px-3 py-3 text-sm text-gray-500">Belum ada potongan.</p>
          {/if}

          <details class="mt-3">
            <summary class={addBtn}>+ Tambah potongan</summary>
            <PriceRow
              kind="component"
              action="tambah"
              submitLabel="Tambah"
              extra={{ productCode: r.product.code }}
              fields={[
                { key: 'name', label: 'Nama potongan', type: 'text', value: '', wide: true, placeholder: 'mis. Kusen atas' },
                { key: 'profileTypeCode', label: 'Jenis profil', type: 'select', value: typeOpts[0]?.value ?? '', options: typeOpts, width: 'w-60' },
                { key: 'lengthFormula', label: 'Panjang (cm)', type: 'text', value: '', placeholder: 'L - 8', width: 'w-36', mono: true },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: '1', width: 'w-28', mono: true },
              ]}
            />
          </details>
        </div>

        <!-- Aksesoris -->
        <div class="card">
          {@render head('Aksesoris', r.rules.length)}
          {#each r.rules as a (a.id)}
            <PriceRow
              kind="rule"
              id={a.id}
              deletable
              fields={[
                { key: 'accessoryCode', label: 'Aksesoris', type: 'info', value: accName.get(a.accessoryCode) ?? a.accessoryCode, wide: true },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: a.qtyFormula, width: 'w-64', mono: true },
                { key: 'optional', label: 'Sifat', type: 'bool', value: a.optional, options: optionalOpts, width: 'w-36' },
              ]}
            />
          {/each}
          {#if r.rules.length === 0}
            <p class="px-3 py-3 text-sm text-gray-500">Belum ada aksesoris.</p>
          {/if}

          <details class="mt-3">
            <summary class={addBtn}>+ Tambah aksesoris ke resep</summary>
            <p class="px-3 pt-2 text-xs text-gray-500">
              Harga dan aksesoris baru diatur di halaman Harga, tab Aksesoris.
            </p>
            <PriceRow
              kind="rule"
              action="tambah"
              submitLabel="Tambah"
              extra={{ productCode: r.product.code }}
              fields={[
                { key: 'accessoryCode', label: 'Aksesoris', type: 'select', value: accOpts[0]?.value ?? '', options: accOpts, wide: true },
                { key: 'qtyFormula', label: 'Jumlah', type: 'text', value: '1', width: 'w-64', mono: true },
                { key: 'optional', label: 'Sifat', type: 'bool', value: false, options: optionalOpts, width: 'w-36' },
              ]}
            />
          </details>
        </div>
      </div>

      <!-- Daftar potong -->
      <div class="space-y-4 xl:sticky xl:top-4">
        <div class="card">
          {@render head('Daftar potong')}
          <p class="mb-3 px-3 text-sm text-gray-500">
            Hasil rumus untuk ukuran tertentu. Simpan perubahan dulu, lalu tekan Lihat.
          </p>
          <form
            method="POST"
            action="?/preview"
            class="space-y-3 px-3"
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
              <label class="block">
                <span class="text-xs text-gray-500">Lebar (cm)</span>
                <input name="L" type="number" min="10" step="any" class="field" bind:value={L} required />
              </label>
              <label class="block">
                <span class="text-xs text-gray-500">Tinggi (cm)</span>
                <input name="T" type="number" min="10" step="any" class="field" bind:value={T} required />
              </label>
              <label class="block">
                <span class="text-xs text-gray-500">Daun</span>
                <input name="S" type="number" min="1" max="10" class="field" bind:value={S} required />
              </label>
            </div>
            <button class="btn w-full" disabled={pvLoading}>{pvLoading ? 'Menghitung…' : 'Lihat daftar potong'}</button>
          </form>
          {#if pvError}
            <p class="mx-3 mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">{pvError}</p>
          {/if}
        </div>

        {#if pv && pv.product.code === r.product.code}
          {#each pv.warnings as w}
            <p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">⚠ {w}</p>
          {/each}

          <div class="card overflow-x-auto p-0">
            <div class="p-4 pb-2">
              <p class="text-sm font-semibold text-brand-900">
                Ukuran {L} × {T} cm, {S} daun
              </p>
            </div>
            <table class="tbl w-full text-sm">
              <thead>
                <tr>
                  <th class="text-left">Potongan</th>
                  <th class="text-right">Panjang</th>
                  <th class="text-right">Jml</th>
                </tr>
              </thead>
              <tbody>
                {#each pv.cuts as c}
                  <tr>
                    <td>{c.name}<div class="text-xs text-gray-500">{c.profile}</div></td>
                    <td class="text-right whitespace-nowrap">{c.length} cm</td>
                    <td class="text-right">{c.qty}</td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class="border-t border-gray-100 p-4">
              <h4 class="mb-1 text-sm font-semibold text-brand-900">Total per jenis profil</h4>
              {#each pv.profileMeters as m}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">{m.profile}</span>
                  <span class="font-medium">{m.meters} m</span>
                </div>
              {/each}
            </div>

            <div class="border-t border-gray-100 p-4 text-sm">
              <h4 class="mb-1 font-semibold text-brand-900">Kaca</h4>
              {#if pv.glass}
                <p>{pv.glass.width} × {pv.glass.height} cm, {pv.glass.pieces} bidang</p>
              {:else}
                <p class="text-gray-500">Produk ini tanpa kaca</p>
              {/if}
            </div>

            <div class="border-t border-gray-100 p-4 text-sm">
              <h4 class="mb-1 font-semibold text-brand-900">Aksesoris</h4>
              {#each pv.accessories as a}
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">{a.name}{a.optional ? ' (opsional)' : ''}</span>
                  <span class="font-medium">{a.qty}</span>
                </div>
              {:else}
                <p class="text-gray-500">Tidak ada aksesoris</p>
              {/each}
            </div>
          </div>
        {:else}
          <p class="rounded-xl border border-dashed border-brand-300 p-4 text-center text-sm text-gray-500">
            Hasilnya muncul di sini setelah kamu menekan Lihat.
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>