<script lang="ts">
  import { rupiah } from "../../lib/api";
  import MoneyInput from "../../lib/components/MoneyInput.svelte";

  let { data, form } = $props();

  // Minta konfirmasi sebelum menonaktifkan
  function confirmDeactivate(e: SubmitEvent) {
    if (!confirm("Nonaktifkan material ini? Riwayat order lama tetap aman.")) {
      e.preventDefault();
    }
  }
</script>

<main class="mx-auto max-w-5xl p-6">
  <h1 class="mb-4 text-2xl font-bold">Katalog Material</h1>

  {#if form?.messages}
    <ul class="mb-4 rounded bg-red-100 p-3 text-red-700">
      {#each form.messages as m}
        <li>{m}</li>
      {/each}
    </ul>
  {/if}
  {#if form?.success}
    <p class="mb-4 rounded bg-green-100 p-3 text-green-700">{form.message}</p>
  {/if}

  <!-- Form tambah material -->
  <details class="mb-6 rounded border p-4" open={!!form?.values}>
    <summary class="cursor-pointer font-semibold">+ Tambah material</summary>

    <form
      method="POST"
      action="?/create"
      class="mt-3 grid gap-3 sm:grid-cols-2"
    >
      <input
        name="name"
        placeholder="Nama (mis. Profil kusen 4 inci)"
        required
        value={form?.values?.name ?? ""}
        class="rounded border px-3 py-2"
      />
      <input
        name="category"
        placeholder="Kategori (profil, kaca, aksesoris)"
        required
        value={form?.values?.category ?? ""}
        class="rounded border px-3 py-2"
      />
      <input
        name="brand"
        placeholder="Merk (opsional)"
        value={form?.values?.brand ?? ""}
        class="rounded border px-3 py-2"
      />
      <input
        name="unit"
        placeholder="Satuan (batang, m2, pcs)"
        required
        value={form?.values?.unit ?? ""}
        class="rounded border px-3 py-2"
      />
      <MoneyInput
        name="price"
        placeholder="Harga per satuan"
        required
        value={Number(form?.values?.price) || 0}
      />
      <input
        name="lengthPerUnit"
        type="number"
        min="0"
        step="0.01"
        placeholder="Panjang 1 batang (meter, opsional)"
        value={form?.values?.lengthPerUnit ?? ""}
        class="rounded border px-3 py-2"
      />
      <button
        class="rounded bg-orange-500 px-4 py-2 font-semibold text-white sm:col-span-2"
      >
        Simpan material
      </button>
    </form>
  </details>

  <!-- Pencarian: kirim ?search=... ke halaman yang sama -->
  <form method="GET" class="mb-4 flex gap-2">
    <input
      name="search"
      value={data.search}
      placeholder="Cari nama material..."
      class="w-full rounded border px-3 py-2"
    />
    <button class="rounded bg-orange-500 px-4 py-2 font-semibold text-white"
      >Cari</button
    >
  </form>

  {#if data.error}
    <p class="rounded bg-red-100 p-3 text-red-700">
      Gagal memuat data: {data.error}
    </p>
  {:else if data.materials.length === 0}
    <p class="text-gray-500">Belum ada material.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b bg-gray-100">
            <th class="p-2">Nama</th>
            <th class="p-2">Kategori</th>
            <th class="p-2">Merk</th>
            <th class="p-2">Satuan</th>
            <th class="p-2 text-right">Harga</th>
            <th class="p-2">Ubah harga</th>
            <th class="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.materials as m (m.id)}
            <tr class="border-b">
              <td class="p-2">{m.name}</td>
              <td class="p-2">{m.category}</td>
              <td class="p-2">{m.brand ?? "-"}</td>
              <td class="p-2">{m.unit}</td>
              <td class="p-2 text-right">{rupiah(m.price)}</td>
              <td class="p-2">
                <form method="POST" action="?/update" class="flex gap-1">
                  <input type="hidden" name="id" value={m.id} />
                  <MoneyInput
                    name="price"
                    required
                    placeholder="Harga baru"
                    class="w-40"
                  />
                  <button
                    class="rounded bg-orange-500 px-3 py-1 text-sm font-semibold text-white"
                  >
                    Simpan
                  </button>
                </form>
              </td>
              <td class="p-2">
                <form
                  method="POST"
                  action="?/deactivate"
                  onsubmit={confirmDeactivate}
                >
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    class="rounded border border-red-400 px-3 py-1 text-sm text-red-600"
                  >
                    Nonaktifkan
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>
