<script lang="ts">
    import { enhance } from '$app/forms';

    let { form } = $props();

    // true selama form dikirim, mencegah kiriman ganda
    let submitting = $state(false);
</script>

<main class="mx-auto mt-24 max-w-sm p-6">
    <h1 class="mb-1 text-2xl font-bold">Masuk</h1>
    <p class="mb-6 text-gray-600">Aplikasi Estimasi dan Order Aluminium</p>

    {#if form?.message}
        <p class="mb-4 rounded bg-red-100 p-3 text-red-700">{form.message}</p>
    {/if}

    <form
        method="POST"
        class="grid gap-3"
        use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
                await update({ reset: false });
                submitting = false;
            };
        }}
    >
        <label class="flex flex-col text-sm">
            Username
            <input name="username" required autocomplete="username" value={form?.username ?? ''}
                class="rounded border px-3 py-2" />
        </label>
        <label class="flex flex-col text-sm">
            Password
            <input name="password" type="password" required autocomplete="current-password"
                class="rounded border px-3 py-2" />
        </label>
        <button
            disabled={submitting}
            class="rounded bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
            {submitting ? 'Masuk...' : 'Masuk'}
        </button>
    </form>
</main>
