<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const files = [
		{
			name: 'backup.json',
			title: 'Backup lengkap',
			desc: 'Semua pelanggan, material, order beserta item, pembayaran, dan keterangan foto. Akun admin tidak ikut.',
			tag: 'Backup',
			primary: true
		},
		{
			name: 'orders.csv',
			title: 'Order',
			desc: 'Modal, harga kesepakatan, untung, margin, sudah dibayar, dan sisa tagihan tiap order.',
			tag: 'Excel'
		},
		{
			name: 'payments.csv',
			title: 'Pembayaran',
			desc: 'Semua DP, cicilan, dan pelunasan yang pernah dicatat.',
			tag: 'Excel'
		},
		{
			name: 'customers.csv',
			title: 'Pelanggan',
			desc: 'Daftar pelanggan lengkap dengan jumlah ordernya.',
			tag: 'Excel'
		},
		{
			name: 'materials.csv',
			title: 'Material',
			desc: 'Katalog material beserta harganya.',
			tag: 'Excel'
		}
	];

	// Setelah backup diunduh, muat ulang data supaya keterangan "backup terakhir" ikut berubah
	function afterDownload(name: string) {
		if (name === 'backup.json') setTimeout(() => invalidateAll(), 1500);
	}

	let status = $derived.by(() => {
		if (data.backupDays === null) return { text: 'Belum pernah backup dari browser ini.', warn: true };
		if (data.backupDays === 0) return { text: 'Backup terakhir: hari ini.', warn: false };
		return { text: `Backup terakhir: ${data.backupDays} hari lalu.`, warn: data.backupDays >= 7 };
	});
</script>

<main class="mx-auto max-w-4xl p-4 md:p-6">
	<div class="mb-4">
		<h1 class="page-title">Ekspor dan backup</h1>
		<p class="text-gray-500">Unduh data untuk dibuka di Excel, atau simpan sebagai cadangan.</p>
	</div>

	<p
		class="mb-4 rounded-lg p-3 {status.warn
			? 'bg-amber-100 text-amber-800'
			: 'bg-green-100 text-green-700'}"
	>
		{status.text}
		{#if status.warn}Sebaiknya unduh backup lengkap secara berkala.{/if}
	</p>

	<div class="grid gap-3 sm:grid-cols-2">
		{#each files as f (f.name)}
			<section class="card flex flex-col justify-between gap-3">
				<div>
					<div class="flex items-center justify-between gap-2">
						<h2 class="text-lg font-semibold text-brand-900">{f.title}</h2>
						<span class="rounded-full bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-700">{f.tag}</span>
					</div>
					<p class="mt-1 text-sm text-gray-600">{f.desc}</p>
				</div>
				<!-- download dan data-sveltekit-reload: supaya diunduh biasa, bukan diproses router -->
				<a
					href="/export/{f.name}"
					download
					data-sveltekit-reload
					onclick={() => afterDownload(f.name)}
					class={f.primary ? 'btn' : 'btn-outline self-start'}
				>
					Unduh {f.name}
				</a>
			</section>
		{/each}
	</div>

	<section class="card mt-4 text-sm text-gray-600">
		<h2 class="mb-1 text-lg font-semibold text-brand-900">Yang perlu diingat</h2>
		<ul class="list-disc space-y-1 pl-5">
			<li>
				<strong>Foto tidak ikut</strong> di backup lengkap, karena berupa file. Untuk mem-backup foto, salin
				folder <code>backend/uploads</code> secara berkala.
			</li>
			<li>
				Simpan backup <strong>di luar laptop ini</strong> (flashdisk atau penyimpanan online). Backup yang
				cuma ada di satu laptop ikut hilang kalau laptopnya rusak.
			</li>
			<li>
				File Excel (CSV) memakai pemisah titik koma. Kalau semua isi menumpuk di satu kolom saat dibuka,
				beri tahu agar disesuaikan.
			</li>
		</ul>
	</section>
</main>