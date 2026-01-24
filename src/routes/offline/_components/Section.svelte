<script>
    export let title;
    export let description = '';
</script>

<div class="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 space-y-3">
    <div>
        <h3 class="font-semibold">{title}</h3>
        {#if description}
            <p class="text-xs opacity-70">{description}</p>
        {/if}
    </div>
    <div class="space-y-2">
        <slot />
    </div>
</div>
