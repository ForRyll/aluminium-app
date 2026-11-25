<script lang="ts">
  import { enhance } from '$app/forms';
  import { rupiah } from '../../lib/api';

  let { data, form } = $props();

  // svelte-ignore state_referenced_locally
  const o = data.options;

  // ---------- Isian ----------
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

  // ---------- Hasil ----------
  let shown: any = $state(null);
  let calcKey = $state('');
  let loading = $state(false);
  let formEl: HTMLFormElement | undefined = $state();

  // ---------- Masukkan ke order ----------
  let target = $state('new');
  let customerId = $state('');
  let orderId = $state('');
  let title = $state('');
  let saving = $state(false);

  // ---------- Simulasi tawar ----------
  let offer: number | null = $state(null);

  const optList = $derived(o.optionalAccessories.filter((a: any) => a.productCode === productCode));

  const inputKey = $derived(
    JSON.stringify([productCode, L, T, S, brand, mode, glassId, finishing, complex, withInstall, markupPct, optional])
  );
  const stale = $derived(shown !== null && calcKey !== inputKey);
  const valid = $derived(L >= 10 && T >= 10 && S >= 1 && !!brand && !!productCode);

  // Hitung otomatis setengah detik setelah berhenti mengetik
  let timer: ReturnType<typeof setTimeout>;
  $effect(() => {
    void inputKey;
    if (!formEl || !valid) return;
    clearTimeout(timer);
    timer = setTimeout(() => formEl?.requestSubmit(), 450);
    return () => clearTimeout(timer);
  });

  // ---------- Tampilan hasil ----------
  const groupName: Record<string, string> = {
    profil: 'Profil',
    finishing: 'Finishing',
    waste: 'Sisa potongan',
    kaca: 'Kaca',
    aksesoris: 'Aksesoris',
    upah: 'Upah',
    overhead: 'Biaya lain',
  };
  const groupColor: Record<string, string> = {
    profil: 'bg-brand-700',
    finishing: 'bg-brand-300',
    waste: 'bg-brand-500',
    kaca: 'bg-sky-400',
    aksesoris: 'bg-amber-400',
    upah: 'bg-emerald-500',
    overhead: 'bg-slate-400',
  };
  const order = ['profil', 'finishing', 'waste', 'kaca', 'aksesoris', 'upah', 'overhead'];

  const groups = $derived(
    shown
      ? order
          .map((g) => {
            const rows = shown.lines.filter((l: any) => l.group === g);
            return { g, rows, total: rows.reduce((s: number, l: any) => s + l.cost, 0) };
          })
          .filter((x) => x.rows.length)
      : []
  );

  const status = $derived(
    !shown ? null : shown.profit < 0 ? 'rugi' : shown.marginPct < 15 ? 'tipis' : 'aman'
  );
  const statusStyle: Record<string, string> = {
    aman: 'bg-emerald-100 text-emerald-700',
    tipis: 'bg-amber-100 text-amber-700',
    rugi: 'bg-red-100 text-red-700',
  };
  const statusText: Record<string, string> = { aman: 'Aman', tipis: 'Tipis', rugi: 'Rugi' };

  // Harga terendah yang masih margin 15% dari harga jual
  const safePrice = $derived(shown ? Math.ceil(shown.cost / 0.85 / 1000) * 1000 : 0);

  const offerProfit = $derived(shown && offer ? offer - shown.cost : null);
  const offerMargin = $derived(offerProfit !== null && offer ? (offerProfit / (offer as number)) * 100 : null);
  const offerStatus = $derived(
    offerProfit === null || offerMargin === null ? null : offerProfit < 0 ? 'rugi' : offerMargin < 15 ? 'tipis' : 'aman'
  );

  const busy = $derived(loading || stale);
</script>

<div class="p-4 pb-28 md:p-6 lg:pb-6">
  <div class="mb-5">
    <h1 class="page-title">Kalkulator</h1>
    <p class="text-sm opacity-70">Isi ukuran dan pilihan bahan, harga langsung dihitung.</p>
  </div>

  <div class="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
    <!-- ================= FORM ================= -->
    <form
      bind:this={formEl}
      method="POST"
      action="?/hitung"
      class="space-y-4"
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
      <!-- 1. Produk -->
      <section class="card">
        <h2 class="mb-3 flex items-center gap-2 font-semibold">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs text-white">1</span>
          Produk
        </h2>
        <input type="hidden" name="productCode" value={productCode} />
        <div class="flex flex-wrap gap-2">
          {#each o.products as p}
            <button
              type="button"
              class="rounded-full border px-4 py-2 text-sm font-medium transition {productCode === p.code
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-brand-300 bg-white text-brand-700 hover:bg-brand-100'}"
              onclick={() => {
                productCode = p.code;
                optional = [];
              }}
            >
              {p.name}
            </button>
          {/each}
        </div>
      </section>

      <!-- 2. Ukuran -->
      <section class="card">
        <h2 class="mb-3 flex items-center gap-2 font-semibold">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs text-white">2</span>
          Ukuran
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs opacity-60">Lebar</span>
            <div class="relative">
              <input name="L" type="number" min="10" step="any" inputmode="decimal" class="field pr-10 text-lg font-semibold" bind:value={L} required />
              <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm opacity-50">cm</span>
            </div>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs opacity-60">Tinggi</span>
            <div class="relative">
              <input name="T" type="number" min="10" step="any" inputmode="decimal" class="field pr-10 text-lg font-semibold" bind:value={T} required />
              <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm opacity-50">cm</span>
            </div>
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <span class="text-sm">Jumlah daun</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-full border border-brand-300 text-lg text-brand-700 hover:bg-brand-100"
              aria-label="Kurangi daun"
              onclick={() => (S = Math.max(1, (S || 1) - 1))}>−</button>
            <input name="S" type="number" min="1" max="10" class="field w-16 text-center text-lg font-semibold" bind:value={S} required />
            <button
              type="button"
              class="grid h-10 w-10 place-items-center rounded-full border border-brand-300 text-lg text-brand-700 hover:bg-brand-100"
              aria-label="Tambah daun"
              onclick={() => (S = Math.min(10, (S || 1) + 1))}>+</button>
          </div>
        </div>
      </section>

      <!-- 3. Bahan -->
      <section class="card space-y-3">
        <h2 class="flex items-center gap-2 font-semibold">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs text-white">3</span>
          Bahan
        </h2>

        <label class="block">
          <span class="mb-1 block text-xs opacity-60">Merk profil</span>
          <select name="brand" class="field" bind:value={brand}>
            {#each o.brands as b}<option value={b}>{b}</option>{/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs opacity-60">Kaca</span>
          <select name="glassId" class="field" bind:value={glassId}>
            {#each o.glasses as g}
              <option value={g.id}>{g.label} ({rupiah(g.pricePerM2)}/m²)</option>
            {/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs opacity-60">Warna / finishing</span>
          <select name="finishing" class="field" bind:value={finishing}>
            {#each o.finishings as f}
              <option value={f.name}>{f.name}{f.percent ? ` (+${f.percent}%)` : ''}</option>
            {/each}
          </select>
        </label>

        <div>
          <span class="mb-1 block text-xs opacity-60">Cara beli profil</span>
          <input type="hidden" name="mode" value={mode} />
          <div class="grid grid-cols-2 rounded-full border border-brand-300 p-1 text-sm font-medium">
            <button
              type="button"
              class="rounded-full px-3 py-2 transition {mode === 'meter' ? 'bg-brand-600 text-white' : 'text-brand-700'}"
              onclick={() => (mode = 'meter')}>Meter lari</button>
            <button
              type="button"
              class="rounded-full px-3 py-2 transition {mode === 'bar' ? 'bg-brand-600 text-white' : 'text-brand-700'}"
              onclick={() => (mode = 'bar')}>Batang utuh</button>
          </div>
          <p class="mt-1 text-xs opacity-60">
            {mode === 'meter' ? 'Dihitung per meter, ditambah sisa potongan.' : 'Dibulatkan ke batang 6 m, sisanya sudah masuk hitungan.'}
          </p>
        </div>

        <label class="block">
          <span class="mb-1 block text-xs opacity-60">Markup dari modal</span>
          <div class="relative">
            <input name="markupPct" type="number" min="0" max="300" step="any" class="field pr-8" bind:value={markupPct} />
            <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm opacity-50">%</span>
          </div>
        </label>

        <div class="space-y-2 border-t border-gray-100 pt-3">
          <label class="flex items-center gap-3 text-sm">
            <input type="checkbox" name="withInstall" class="h-5 w-5 accent-brand-600" bind:checked={withInstall} />
            Termasuk pemasangan
          </label>
          <label class="flex items-center gap-3 text-sm">
            <input type="checkbox" name="complex" class="h-5 w-5 accent-brand-600" bind:checked={complex} />
            Pekerjaan rumit (sisa potongan lebih besar)
          </label>
          {#each optList as a}
            <label class="flex items-center gap-3 text-sm">
              <input type="checkbox" name="includeOptional" value={a.code} class="h-5 w-5 accent-brand-600" bind:group={optional} />
              {a.name} <span class="text-xs opacity-50">(opsional)</span>
            </label>
          {/each}
        </div>
      </section>
    </form>

    <!-- ================= HASIL ================= -->
    <div class="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
      {#if form?.error}
        <div class="card border-red-200 bg-red-50 text-red-700">{form.error}</div>
      {/if}

      {#if !shown && !form?.error}
        <div class="card text-center">
          <div class="text-3xl">🧮</div>
          <p class="mt-2 font-medium">{valid ? 'Menghitung…' : 'Isi ukuran dulu'}</p>
          <p class="text-sm opacity-60">Lebar dan tinggi minimal 10 cm.</p>
        </div>
      {/if}

      {#if shown}
        <!-- Harga jual -->
        <section class="rounded-2xl bg-brand-600 p-5 text-white shadow-sm {busy ? 'opacity-70' : ''}">
          <div class="flex items-start justify-between gap-3">
            <div class="text-sm text-brand-100">Harga jual · {shown.product.name} {L} × {T} cm</div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold {statusStyle[status ?? 'aman']}">
              {busy ? 'Menghitung…' : statusText[status ?? 'aman']}
            </span>
          </div>
          <div class="mt-1 text-4xl font-bold tracking-tight">{rupiah(shown.price)}</div>
          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
            <div>
              <div class="text-xs text-brand-100">Modal</div>
              <div class="font-semibold">{rupiah(shown.cost)}</div>
            </div>
            <div>
              <div class="text-xs text-brand-100">Untung</div>
              <div class="font-semibold">{rupiah(shown.profit)}</div>
            </div>
            <div>
              <div class="text-xs text-brand-100">Margin</div>
              <div class="font-semibold">{shown.marginPct}%</div>
            </div>
          </div>
        </section>

        {#each shown.warnings as w}
          <div class="card border-amber-200 bg-amber-50 text-amber-800">⚠ {w}</div>
        {/each}

        <!-- Simulasi tawar -->
        <section class="card">
          <h2 class="font-semibold">Kalau pelanggan menawar</h2>
          <p class="mb-3 text-sm opacity-70">
            Batas aman (margin 15%): <b>{rupiah(safePrice)}</b>. Modal: <b>{rupiah(shown.cost)}</b>, di bawah itu rugi.
          </p>
          <label class="block">
            <span class="mb-1 block text-xs opacity-60">Harga tawar</span>
            <div class="relative">
              <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm opacity-50">Rp</span>
              <input type="number" min="0" step="any" inputmode="numeric" class="field pl-10" placeholder={String(shown.price)} bind:value={offer} />
            </div>
          </label>
          {#if offer && offerProfit !== null && offerMargin !== null && offerStatus}
            <div class="mt-3 flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div>
                <div class="text-xs opacity-60">Untung</div>
                <div class="font-semibold {offerProfit < 0 ? 'text-red-600' : ''}">{rupiah(offerProfit)}</div>
              </div>
              <div>
                <div class="text-xs opacity-60">Margin</div>
                <div class="font-semibold">{offerMargin.toFixed(1)}%</div>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold {statusStyle[offerStatus]}">{statusText[offerStatus]}</span>
            </div>
          {/if}
        </section>

        <!-- Komposisi biaya -->
        <section class="card">
          <h2 class="mb-3 font-semibold">Ke mana uangnya pergi</h2>
          <div class="flex h-3 overflow-hidden rounded-full bg-gray-100">
            {#each groups as grp}
              <div class="{groupColor[grp.g]}" style="width: {(grp.total / shown.cost) * 100}%" title={groupName[grp.g]}></div>
            {/each}
          </div>
          <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            {#each groups as grp}
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 shrink-0 rounded-full {groupColor[grp.g]}"></span>
                <span class="truncate">{groupName[grp.g]}</span>
                <span class="ml-auto opacity-60">{Math.round((grp.total / shown.cost) * 100)}%</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Rincian -->
        <section class="card {busy ? 'opacity-60' : ''}">
          <h2 class="mb-1 font-semibold">Rincian modal</h2>
          {#each groups as grp}
            <div class="mt-3 flex items-center justify-between border-b border-gray-100 pb-1">
              <div class="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase opacity-70">
                <span class="h-2.5 w-2.5 rounded-full {groupColor[grp.g]}"></span>{groupName[grp.g]}
              </div>
              <div class="text-sm font-semibold">{rupiah(grp.total)}</div>
            </div>
            {#each grp.rows as l}
              <div class="flex items-start justify-between gap-3 py-1.5 text-sm">
                <div class="min-w-0">
                  <div>{l.label}</div>
                  <div class="text-xs opacity-50">{l.qty} {l.unit} × {rupiah(l.unitPrice)}</div>
                </div>
                <div class="shrink-0">{rupiah(l.cost)}</div>
              </div>
            {/each}
          {/each}
          <div class="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 font-semibold">
            <span>Total modal</span><span>{rupiah(shown.cost)}</span>
          </div>
          <p class="mt-2 text-xs opacity-50">
            Harga dan rumus masih data simulasi (belum diverifikasi). Atur di halaman Harga dan Resep.
          </p>
        </section>

        <!-- Masukkan ke order -->
        <form
          id="ke-order"
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

          <input type="hidden" name="target" value={target} />
          <div class="grid grid-cols-2 rounded-full border border-brand-300 p-1 text-sm font-medium">
            <button
              type="button"
              class="rounded-full px-3 py-2 transition {target === 'new' ? 'bg-brand-600 text-white' : 'text-brand-700'}"
              onclick={() => (target = 'new')}>Order baru</button>
            <button
              type="button"
              class="rounded-full px-3 py-2 transition {target === 'existing' ? 'bg-brand-600 text-white' : 'text-brand-700'}"
              onclick={() => (target = 'existing')}>Tambah ke order</button>
          </div>

          {#if target === 'new'}
            <label class="block">
              <span class="mb-1 block text-xs opacity-60">Pelanggan</span>
              <select name="customerId" class="field" bind:value={customerId}>
                <option value="">- pilih pelanggan -</option>
                {#each data.customers as c}<option value={c.id}>{c.name}</option>{/each}
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block text-xs opacity-60">Judul order (boleh kosong)</span>
              <input name="title" class="field" bind:value={title} placeholder="mis. Jendela kamar depan" />
            </label>
          {:else}
            <label class="block">
              <span class="mb-1 block text-xs opacity-60">Order (draft atau penawaran)</span>
              <select name="orderId" class="field" bind:value={orderId}>
                <option value="">- pilih order -</option>
                {#each data.orders as ord}<option value={ord.id}>{ord.label}</option>{/each}
              </select>
            </label>
            <p class="text-xs opacity-60">Item, biaya, dan harga tawar ditambahkan ke order itu.</p>
          {/if}

          {#if form?.orderError}
            <div class="text-sm text-red-600">{form.orderError}</div>
          {/if}

          <button class="btn w-full" disabled={saving || busy}>
            {saving ? 'Menyimpan…' : busy ? 'Menunggu hitungan…' : 'Masukkan ke order'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<!-- Bar harga di bawah layar (HP) -->
{#if shown}
  <div class="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden print:hidden">
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-xs opacity-60">Harga jual {busy ? '· menghitung…' : ''}</div>
        <div class="text-lg font-bold text-brand-700">{rupiah(shown.price)}</div>
      </div>
      <a href="#ke-order" class="btn">Masukkan ke order</a>
    </div>
  </div>
{/if}