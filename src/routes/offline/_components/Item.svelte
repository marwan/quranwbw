<script>
    import { createEventDispatcher } from 'svelte';
    import Spinner from '$svgs/Spinner.svelte';
    import Check from '$svgs/Check.svelte';
    import Download from '$svgs/Download.svelte';

    export let label;
    export let sublabel = '';
    export let cached = 0;
    export let total = 0;
    export let downloading = null; // { completed, total } or null

    const dispatch = createEventDispatcher();

    $: percent = total > 0 ? Math.round((cached / total) * 100) : 0;
    $: isComplete = total > 0 && cached >= total;
    $: isDownloading = !!downloading;
    $: downloadInternalPercent = downloading && downloading.total > 0 
        ? Math.round((downloading.completed / downloading.total) * 100) 
        : 0;

    // Determine status color
    $: statusColor = isComplete ? 'text-green-500' : (cached > 0 ? 'text-yellow-500' : 'opacity-50');
</script>

<div class="flex items-center justify-between p-2 rounded-xl bg-white/5 dark:bg-black/5">
    <div class="flex flex-col">
        <span class="font-medium text-sm">{label || 'Unknown Resource'}</span>
        {#if sublabel}
            <span class="text-xs opacity-60">{sublabel}</span>
        {/if}
        <span class="text-xs mt-1 {statusColor}">
            {#if isDownloading}
                Downloading: {downloadInternalPercent}%
            {:else}
                {cached} / {total} ({percent}%)
            {/if}
        </span>
    </div>

    <div class="flex items-center gap-2">
        {#if isDownloading}
            <div class="w-8 h-8 flex items-center justify-center">
                 <Spinner size="20" />
            </div>
        {:else if isComplete}
            <button class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center cursor-default">
                <Check size="16" />
            </button>
             <!-- Option to refresh/redownload could go here but let's keep it simple -->
             <button class="p-2 opacity-50 hover:opacity-100" title="Re-download/Verify" on:click={() => dispatch('download')}>
                <Download size="16" />
             </button>
        {:else}
            <button 
                class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-theme hover:text-white transition-colors flex items-center justify-center"
                on:click={() => dispatch('download')}
                title="Download"
            >
                <Download size="16" />
            </button>
        {/if}
    </div>
</div>
