<script lang="ts">
  import { enhance } from '$app/forms';
  import { rupiah } from '../../lib/api';

  let { data, form } = $props();

  // svelte-ignore state_referenced_locally
  const o = data.options;

  let productCode = $state(o.products[0]?.code ?? '');
  let L = $state(120);
  let T = $state(100);
  let S = $state(1);
  let brand = $state(o.brands[0] ?? '');
  let mode = $state('meter');
  let glassId = $state(
    o.glasses.find((g: any) => g.label === 'Bening / clear 5 mm')?.id ?? o.glasses[0]?.id ?? ''
  );
  let finishing = $state(o.finishings[0]?.name ?? '');
  let complex = $state(false);
  let withInstall = $state(true);
  let markupPct = $state(o.settings.markup_standard_pct ?? 25);
  let optional: string[] = $state([]);
  let loading = $state(false);

  // Hasil terakhir disimpan sendiri supaya tidak hilang kalau simpan order gagal
  let shown: any = $state(null);
  let calcKey = $state('');

  // Bagian "masukkan ke order"
  let target = $state('new');
  let customerId = $state('');
  let orderId = $state('');
  let title = $state('');
  let saving = $state(false);

  const optList = $derived(o.optionalAccessories.filter((a: any) => a.productCode === productCode));

  // Penanda isian saat ini. Kalau beda dengan saat Hitung, hasil di layar sudah basi.
  const inputKey = $derived(
    JSON.stringify([productCode, L, T, S, brand, mode, glassId, finishing, complex, withInstall, markupPct, optional])
  );
  const stale = $derived(shown !== null && calcKey !== inputKey);

  const groupName: Record<string, string> = {
    profil: 'Profil',
    finishing: 'Finishing',
    waste: 'Sisa potongan',
    kaca: 'Kaca',
    aksesoris: 'Aksesoris',
    upah: 'Upah',
    overhead: 'Biaya lain',
  };
  const order = ['profil', 'finishing', 'waste', 'kaca', 'aksesoris', 'upah', 'overhead'];

  const grouped = $derived(
    shown
      ? order
          .map((g) => ({ g, rows: shown.lines.filter((l: any) => l.group === g) }))
          .filter((x) => x.rows.length)
      : []
  );

  const marginColor = $derived(
    !shown ? '' : shown.marginPct < 10 ? 'text-red-600' : shown.marginPct < 15 ? 'text-amber-600' : 'text-emerald-600'
  );
</script>

<h1 class="page-title">Kalkulator</h1>

<div class="grid gap-4 lg:grid-cols-[360px_1fr]">
  <form
    method="POST"
    action="?/hitung"
    class="card space-y-3"
    use:enhance={() => {
      loading = true;
      const k = inputKey;
      return async ({ update, result }) => {
        await update({ reset: false });
        if (result.type === 'success' && (result.data as any)?.result) {
          shown = (result.data as any).result;
          calcKey = k;
        }
        loading = false;
      };
    }}
  >
    <label class="block">
      <span class="text-sm">Produk</span>
      <select name="productCode" class="field" bind:value={productCode} onchange={() => (optional = [])}>
        {#each o.products as p}<option value={p.code}>{p.name}</option>{/each}
      </select>
    </label>

    <div class="grid grid-cols-3 gap-2">
      <label class="block"><span class="text-sm">Lebar (cm)</span>
        <input name="L" type="number" min="10" step="any" class="field" bind:value={L} required /></label>
      <label class="block"><span class="text-sm">Tinggi (cm)</span>
        <input name="T" type="number" min="10" step="any" class="field" bind:value={T} required /></label>
      <label class="block"><span class="text-sm">Daun</span>
        <input name="S" type="number" min="1" max="10" class="field" bind:value={S} required /></label>
    </div>

    <label class="block">
      <span class="text-sm">Merk profil</span>
      <select name="brand" class="field" bind:value={brand}>
        {#each o.brands as b}<option value={b}>{b}</option>{/each}
      </select>
    </label>

    <label class="block">
      <span class="text-sm">Kaca</span>
      <select name="glassId" class="field" bind:value={glassId}>
        {#each o.glasses as g}
          <option value={g.id}>{g.label} ({rupiah(g.pricePerM2)}/m²)</option>
        {/each}
      </select>
    </label>

    <label class="block">
      <span class="text-sm">Warna / finishing</span>
      <select name="finishing" class="field" bind:value={finishing}>
        {#each o.finishings as f}<option value={f.name}>{f.name}{f.percent ? ` (+${f.percent}%)` : ''}</option>{/each}
      </select>
    </label>

    <label class="block">
      <span class="text-sm">Pembelian profil</span>
      <select name="mode" class="field" bind:value={mode}>
        <option value="meter">Meter lari + sisa potongan</option>
        <option value="bar">Batang utuh (6 m)</option>
      </select>
    </label>

    <label class="block">
      <span class="text-sm">Markup (% dari modal)</span>
      <input name="markupPct" type="number" min="0" max="300" step="any" class="field" bind:value={markupPct} />
    </label>

    {#if optList.length}
      <div>
        <span class="text-sm">Aksesoris opsional</span>
        {#each optList as a}
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" name="includeOptional" value={a.code} bind:group={optional} /> {a.name}
          </label>
        {/each}
      </div>
    {/if}

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="withInstall" bind:checked={withInstall} /> Termasuk pemasangan
    </label>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" name="complex" bind:checked={complex} /> Pekerjaan rumit (sisa potongan lebih besar)
    </label>

    <button class="btn w-full" disabled={loading}>{loading ? 'Menghitung…' : 'Hitung'}</button>
  </form>

  <div class="space-y-4">
    {#if form?.error}
      <div class="card text-red-600">{form.error}</div>
    {/if}

    {#if !shown && !form?.error}
      <div class="card text-sm opacity-70">Isi ukuran lalu tekan Hitung. Hasil rincian muncul di sini.</div>
    {/if}

    {#if shown}
      {#if stale}
        <div class="card text-amber-700">Isian sudah berubah. Tekan Hitung lagi supaya angka di bawah sesuai.</div>
      {/if}

      <div class="grid gap-3 sm:grid-cols-3 {stale ? 'opacity-50' : ''}">
        <div class="card">
          <div class="text-sm opacity-70">Modal</div>
          <div class="text-xl font-semibold">{rupiah(shown.cost)}</div>
        </div>
        <div class="card">
          <div class="text-sm opacity-70">Harga jual (markup {shown.markupPct}%)</div>
          <div class="text-xl font-semibold">{rupiah(shown.price)}</div>
        </div>
        <div class="card">
          <div class="text-sm opacity-70">Untung</div>
          <div class="text-xl font-semibold {marginColor}">{rupiah(shown.profit)}</div>
          <div class="text-sm {marginColor}">margin {shown.marginPct}% dari harga jual</div>
        </div>
      </div>

      {#each shown.warnings as w}
        <div class="card text-amber-700">⚠ {w}</div>
      {/each}

      <div class="card overflow-x-auto {stale ? 'opacity-50' : ''}">
        <table class="tbl w-full">
          <thead>
            <tr><th class="text-left">Rincian</th><th class="text-right">Jumlah</th><th class="text-right">Harga satuan</th><th class="text-right">Biaya</th></tr>
          </thead>
          <tbody>
            {#each grouped as grp}
              <tr><td colspan="4" class="pt-3 text-xs font-semibold uppercase opacity-60">{groupName[grp.g]}</td></tr>
              {#each grp.rows as l}
                <tr>
                  <td>{l.label}</td>
                  <td class="text-right">{l.qty} {l.unit}</td>
                  <td class="text-right">{rupiah(l.unitPrice)}</td>
                  <td class="text-right">{rupiah(l.cost)}</td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Masukkan ke order -->
      <form
        method="POST"
        action="?/keOrder"
        class="card space-y-3"
        use:enhance={() => {
          saving = true;
          return async ({ update }) => {
            await update({ reset: false });
            saving = false;
          };
        }}
      >
        <h2 class="font-semibold">Masukkan ke order</h2>

        <!-- Isian kalkulator ikut dikirim, server menghitung ulang -->
        <input type="hidden" name="productCode" value={productCode} />
        <input type="hidden" name="L" value={L} />
        <input type="hidden" name="T" value={T} />
        <input type="hidden" name="S" value={S} />
        <input type="hidden" name="brand" value={brand} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="glassId" value={glassId} />
        <input type="hidden" name="finishing" value={finishing} />
        <input type="hidden" name="markupPct" value={markupPct} />
        {#if complex}<input type="hidden" name="complex" value="on" />{/if}
        {#if withInstall}<input type="hidden" name="withInstall" value="on" />{/if}
        {#each optional as code}<input type="hidden" name="includeOptional" value={code} />{/each}

        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-2">
            <input type="radio" name="target" value="new" bind:group={target} /> Order baru
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" name="target" value="existing" bind:group={target} /> Tambah ke order yang ada
          </label>
        </div>

        {#if target === 'new'}
          <label class="block">
            <span class="text-sm">Pelanggan</span>
            <select name="customerId" class="field" bind:value={customerId}>
              <option value="">- pilih pelanggan -</option>
              {#each data.customers as c}<option value={c.id}>{c.name}</option>{/each}
            </select>
          </label>
          <label class="block">
            <span class="text-sm">Judul order (boleh dikosongkan)</span>
            <input name="title" class="field" bind:value={title} placeholder="mis. Jendela kamar depan" />
          </label>
        {:else}
          <label class="block">
            <span class="text-sm">Order (draft atau penawaran)</span>
            <select name="orderId" class="field" bind:value={orderId}>
              <option value="">- pilih order -</option>
              {#each data.orders as ord}<option value={ord.id}>{ord.label}</option>{/each}
            </select>
          </label>
          <p class="text-xs opacity-70">Item, biaya, dan harga tawar ditambahkan ke order itu.</p>
        {/if}

        {#if form?.orderError}
          <div class="text-sm text-red-600">{form.orderError}</div>
        {/if}

        <button class="btn" disabled={saving || stale}>
          {saving ? 'Menyimpan…' : stale ? 'Tekan Hitung dulu' : 'Masukkan ke order'}
        </button>
      </form>

      <p class="text-xs opacity-60">
        Harga dan rumus masih data simulasi (belum diverifikasi). Margin merah di bawah 10%, kuning di bawah 15%.
      </p>
    {/if}
  </div>
</div>