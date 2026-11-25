<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  // true selama form dikirim, mencegah kiriman ganda
  let submitting = $state(false);

  // Warna lingkaran inisial, dipilih tetap berdasarkan nama
  const palette = [
    'bg-brand-100 text-brand-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700'
  ];
  const colorOf = (name: string) => {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
    return palette[h % palette.length];
  };
  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // 0812-3456-7890 -> 6281234567890 (format yang dipakai WhatsApp)
  const waNumber = (phone: string | null) => {
    if (!phone) return null;
    let d = phone.replace(/\D/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    else if (d.startsWith('8')) d = '62' + d;
    return d.length >= 9 ? d : null;
  };
  const telNumber = (phone: string | null) => {
    if (!phone) return null;
    const d = phone.replace(/[^\d+]/g, '');
    return d.length >= 5 ? d : null;
  };
</script>

<main class="mx-auto max-w-6xl p-4 md:p-6">
  <!-- Judul -->
  <details class="mb-4" open={!!form?.values}>
    <summary class="list-none [&::-webkit-details-marker]:hidden">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="page-title">Pelanggan</h1>
          <p class="text-sm text-gray-500">Klik nama pelanggan untuk melihat atau mengubah datanya.</p>
        </div>
        <span class="btn cursor-pointer">+ Pelanggan baru</span>
      </div>
    </summary>

    <!-- Form tambah pelanggan -->
    <form
      method="POST"
      action="?/create"
      class="card mt-4 grid gap-3 sm:grid-cols-2"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update();
          submitting = false;
        };
      }}
    >
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">Nama pelanggan</span>
        <input name="name" placeholder="Nama pelanggan" required value={form?.values?.name ?? ''} class="field" />
      </label>
      <label class="block">
        <span class="mb-1 block text-xs text-gray-500">No. HP</span>
        <input name="phone" placeholder="mis. 0812-3456-7890" value={form?.values?.phone ?? ''} class="field" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs text-gray-500">Alamat pengerjaan (opsional)</span>
        <input name="address" placeholder="Alamat" value={form?.values?.address ?? ''} class="field" />
      </label>
      <label class="block sm:col-span-2">
        <span class="mb-1 block text-xs text-gray-500">Catatan (opsional)</span>
        <input name="notes" placeholder="mis. langganan, minta kaca riben" value={form?.values?.notes ?? ''} class="field" />
      </label>
      <button disabled={submitting} class="btn sm:col-span-2">
        {submitting ? 'Menyimpan...' : 'Simpan pelanggan'}
      </button>
    </form>
  </details>

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

  <!-- Pencarian: nama atau nomor HP -->
  <form method="GET" class="mb-4 flex gap-2">
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
      <input name="search" value={data.search} placeholder="Cari nama atau nomor HP" class="field pl-10" />
    </div>
    <button class="btn">Cari</button>
  </form>

  {#if data.error}
    <div class="card border-red-200 bg-red-50 text-red-700">Gagal memuat data: {data.error}</div>
  {:else if data.customers.length === 0}
    <div class="card py-10 text-center">
      <div class="text-4xl">👥</div>
      <p class="mt-2 font-medium">{data.search ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan'}</p>
      {#if data.search}
        <a href="/customers" class="mt-1 inline-block font-semibold text-brand-600 underline">Hapus pencarian</a>
      {/if}
    </div>
  {:else}
    <p class="mb-3 text-sm text-gray-500">
      {data.customers.length} pelanggan
      {#if data.search}
        · <a href="/customers" class="font-semibold text-brand-600 underline">Hapus pencarian</a>
      {/if}
    </p>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each data.customers as c (c.id)}
        {@const wa = waNumber(c.phone)}
        {@const tel = telNumber(c.phone)}
        <div class="card flex flex-col">
          <div class="flex items-center gap-3">
            <span
              class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold {colorOf(c.name)}"
            >
              {initials(c.name)}
            </span>
            <div class="min-w-0">
              <a href="/customers/{c.id}" class="block truncate text-lg font-semibold text-brand-700 hover:underline">
                {c.name}
              </a>
              <div class="text-sm text-gray-600">{c.phone ?? 'Belum ada nomor HP'}</div>
            </div>
          </div>

          <p class="mt-3 line-clamp-2 min-h-10 text-sm text-gray-600">
            {c.address ? `📍 ${c.address}` : 'Belum ada alamat'}
          </p>

          {#if c.notes}
            <p class="mt-2 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{c.notes}</p>
          {/if}

          <div class="mt-auto flex flex-wrap gap-2 pt-4">
            {#if wa}
              <a
                href="https://wa.me/{wa}"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            {/if}
            {#if tel}
              <a
                href="tel:{tel}"
                class="rounded-full border border-brand-300 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                Telepon
              </a>
            {/if}
            <a
              href="/customers/{c.id}"
              class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Ubah
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>