<script lang="ts">
    import './layout.css';
    import favicon from '../lib/assets/favicon.svg';

    let { children, data } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{#if data.loggedIn}
    <nav class="no-print border-b bg-gray-50">
        <div class="mx-auto flex max-w-5xl items-center gap-5 px-6 py-3">
            <a href="/orders" class="font-semibold text-brand-600">Order</a>
            <a href="/customers">Pelanggan</a>
            <a href="/materials">Material</a>
            <form method="POST" action="/logout" class="ml-auto">
                <button class="rounded border px-3 py-1 text-sm">Keluar</button>
            </form>
        </div>
    </nav>
{/if}

{@render children()}
