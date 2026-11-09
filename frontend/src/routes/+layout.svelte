<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import favicon from '../lib/assets/favicon.svg';

	let { children, data } = $props();

	// Ikon dibuat dari path SVG sederhana, tanpa library tambahan
	const menu = [
		{
			href: '/',
			label: 'Beranda',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/orders',
			label: 'Order',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
		},
		{
			href: '/customers',
			label: 'Pelanggan',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
		},
		{
			href: '/materials',
			label: 'Material',
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
		},
		{
			href: '/export',
			label: 'Ekspor',
			icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
		}
	];

	const logoutIcon =
		'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1';

	// Menu aktif: alamat yang sama, atau halaman di bawahnya (mis. /orders/123)
	// Khusus Beranda ('/'), hanya aktif kalau tepat di '/'
	const isActive = (href: string) =>
		href === '/'
			? page.url.pathname === '/'
			: page.url.pathname === href || page.url.pathname.startsWith(href + '/');

	// Status buka-tutup menu di HP
	let open = $state(false);

	// Tutup menu HP setiap pindah halaman
	$effect(() => {
		void page.url.pathname;
		open = false;
	});

	// Pengingat backup: belum pernah, atau sudah 7 hari lebih. Disembunyikan di halaman Ekspor sendiri.
	let showBackupReminder = $derived(
		(data.backupDays === null || data.backupDays >= 7) && !page.url.pathname.startsWith('/export')
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.loggedIn}
	<div class="min-h-screen bg-brand-600 md:flex md:p-3 print:block print:bg-white print:p-0">
		<!-- Menu samping (layar lebar) -->
		<aside
			class="hidden w-56 shrink-0 flex-col text-white md:sticky md:top-3 md:flex md:h-[calc(100vh-1.5rem)] md:self-start print:hidden"
		>
			<div class="px-4 pt-3 pb-6">
				<div class="rounded-2xl bg-white p-2">
					<img src="/logo.png" alt="Nazril Aluminium" class="mx-auto h-16 w-auto" />
				</div>
			</div>

			<nav class="flex flex-1 flex-col gap-1 pl-3">
				{#each menu as m (m.href)}
					<a
						href={m.href}
						class="flex items-center gap-3 rounded-l-full py-3 pr-4 pl-5 font-medium transition {isActive(
							m.href
						)
							? 'bg-white text-brand-700'
							: 'text-brand-100 hover:bg-brand-500'}"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d={m.icon} />
						</svg>
						{m.label}
					</a>
				{/each}
			</nav>

			<form method="POST" action="/logout" class="p-4">
				<button
					class="flex w-full items-center gap-3 rounded-full px-5 py-3 text-brand-100 transition hover:bg-brand-500"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d={logoutIcon} />
					</svg>
					Keluar
				</button>
			</form>
		</aside>

		<!-- Bar atas (HP) -->
		<header class="sticky top-0 z-10 bg-brand-600 text-white md:hidden print:hidden">
			<div class="flex items-center justify-between px-4 py-2">
				<div class="rounded-xl bg-white px-2 py-1">
					<img src="/logo.png" alt="Nazril Aluminium" class="h-9 w-auto" />
				</div>
				<button
					onclick={() => (open = !open)}
					aria-label="Buka atau tutup menu"
					class="rounded-lg border border-brand-300 p-2"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						/>
					</svg>
				</button>
			</div>

			{#if open}
				<nav class="grid gap-1 px-3 pb-3">
					{#each menu as m (m.href)}
						<a
							href={m.href}
							class="flex items-center gap-3 rounded-xl px-4 py-3 font-medium {isActive(m.href)
								? 'bg-white text-brand-700'
								: 'text-brand-100 hover:bg-brand-500'}"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d={m.icon} />
							</svg>
							{m.label}
						</a>
					{/each}
					<form method="POST" action="/logout">
						<button
							class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-brand-100 hover:bg-brand-500"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d={logoutIcon} />
							</svg>
							Keluar
						</button>
					</form>
				</nav>
			{/if}
		</header>

		<!-- Kartu konten -->
		<div class="min-w-0 flex-1 bg-white md:rounded-3xl print:rounded-none">
			{#if showBackupReminder}
				<div
					class="flex flex-wrap items-center justify-between gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-800 md:rounded-t-3xl print:hidden"
				>
					<span>
						{data.backupDays === null
							? 'Data belum pernah di-backup dari browser ini.'
							: `Backup terakhir ${data.backupDays} hari lalu.`}
					</span>
					<a href="/export" class="font-semibold underline">Backup sekarang</a>
				</div>
			{/if}
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}