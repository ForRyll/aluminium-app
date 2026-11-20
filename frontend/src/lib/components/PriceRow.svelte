<script lang="ts">
  import { enhance } from '$app/forms';
  import { rupiah } from '../api';

  type FieldDef = {
    key: string;
    label: string;
    type: 'text' | 'money' | 'number' | 'select' | 'bool' | 'info';
    value?: string | number | boolean | null;
    options?: { value: string; label: string }[];
    suffix?: string;
    placeholder?: string;
    wide?: boolean;
  };

  let {
    kind,
    id = '',
    fields,
    action = 'simpan',
    submitLabel = 'Simpan',
    deletable = false,
    extra = {},
  }: {
    kind: string;
    id?: string;
    fields: FieldDef[];
    action?: 'simpan' | 'tambah';
    submitLabel?: string;
    deletable?: boolean;
    extra?: Record<string, string>; // isian tersembunyi, mis. kode produk
  } = $props();

  // Awalan nama kolom memberi tahu server jenis nilainya
  const prefix = (f: FieldDef) =>
    f.type === 'money' || f.type === 'number' ? 'n_' : f.type === 'bool' ? 'b_' : 's_';

  const widthClass = (f: FieldDef) =>
    f.wide ? 'min-w-48 flex-1' : f.key === 'status' ? 'w-52' : 'w-40';

  // svelte-ignore state_referenced_locally
  const initial: Record<string, any> = Object.fromEntries(
    fields.map((f) => [f.key, f.type === 'bool' ? String(f.value ?? 'true') : (f.value ?? '')])
  );
  // svelte-ignore state_referenced_locally
  let vals: Record<string, any> = $state({ ...initial });

  let saving = $state(false);
  let msg = $state('');
  let ok = $state(true);

  const hasValue = (v: unknown) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));
</script>

<form
  method="POST"
  action={`?/${action}`}
  class="flex flex-wrap items-start gap-3 border-b border-gray-100 py-3"
  use:enhance={({ action: target }) => {
    const deleting = target.search.includes('hapus');
    saving = true;
    msg = '';
    return async ({ result, update }) => {
      await update({ reset: false });
      saving = false;
      if (result.type === 'success' || result.type === 'redirect') {
        ok = true;
        msg = deleting ? 'Dihapus' : action === 'tambah' ? 'Ditambahkan' : 'Tersimpan';
        if (action === 'tambah') vals = { ...initial };
      } else if (result.type === 'failure') {
        ok = false;
        msg = (result.data as any)?.error ?? 'Gagal menyimpan';
      } else {
        ok = false;
        msg = 'Gagal menyimpan';
      }
    };
  }}
>
  <input type="hidden" name="kind" value={kind} />
  {#if id}<input type="hidden" name="id" value={id} />{/if}
  {#each Object.entries(extra) as [k, v] (k)}
    <input type="hidden" name={'s_' + k} value={v} />
  {/each}

  {#each fields as f (f.key)}
    {#if f.type === 'info'}
      <div class={widthClass(f)}>
        <span class="block h-4 text-xs leading-4 opacity-60">{f.label}</span>
        <div class="flex min-h-10 items-center text-sm font-medium">{f.value}</div>
        <span class="block h-4"></span>
      </div>
    {:else}
      <label class="block {widthClass(f)}">
        <span class="block h-4 text-xs leading-4 opacity-60">{f.label}{f.suffix ? ` (${f.suffix})` : ''}</span>
        {#if f.type === 'select' || f.type === 'bool'}
          <select name={prefix(f) + f.key} class="field" bind:value={vals[f.key]}>
            {#each f.options ?? [] as opt}<option value={opt.value}>{opt.label}</option>{/each}
          </select>
        {:else if f.type === 'money' || f.type === 'number'}
          <input
            name={prefix(f) + f.key}
            type="number"
            min="0"
            step="any"
            class="field"
            placeholder={f.placeholder}
            bind:value={vals[f.key]}
          />
        {:else}
          <input name={prefix(f) + f.key} class="field" placeholder={f.placeholder} bind:value={vals[f.key]} />
        {/if}
        <!-- Baris tetap di bawah kotak: tinggi semua kolom sama -->
        <span class="block h-4 text-xs leading-4 opacity-60">
          {#if f.type === 'money' && hasValue(vals[f.key])}{rupiah(Number(vals[f.key]))}{/if}
        </span>
      </label>
    {/if}
  {/each}

  <div class="mt-4 flex flex-wrap items-center gap-3">
    <button class="btn" disabled={saving}>{saving ? 'Menyimpan…' : submitLabel}</button>
    {#if deletable}
      <button
        formaction="?/hapus"
        disabled={saving}
        class="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        onclick={(e) => {
          if (!confirm('Hapus baris ini?')) e.preventDefault();
        }}
      >
        Hapus
      </button>
    {/if}
    {#if msg}<span class="text-sm {ok ? 'text-emerald-600' : 'text-red-600'}">{msg}</span>{/if}
  </div>
</form>