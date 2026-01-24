<script>
	import { __bottomAlert } from '$utils/stores';
	import { fly, fade } from 'svelte/transition';
</script>

{#if $__bottomAlert?.visible}
	<div
		class="fixed bottom-6 left-1/2 z-[50] -translate-x-1/2 rounded-full px-4 py-2 text-sm shadow-lg {window.theme('bgSecondary')} {window.theme('textBgColor')}"
		role="status"
		aria-live="polite"
		in:fly={{ y: 8, duration: 150 }}
		out:fade={{ duration: 150 }}
	>
		{$__bottomAlert.message}
	</div>
{/if}
