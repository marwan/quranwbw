<script>
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';

	export let size = '16';
	export let margin = '';
	export let inline = false;
	export let delay = 200;
	export let hideMessages = false;
	export let strokeWidth = 1;

	let message = '';
	let visible = false;
	let timeouts = [];

	const messages = [
		{ delay: 2000, text: 'Just a moment…' },
		{ delay: 6000, text: 'Still loading, hang in there.' },
		{ delay: 12000, text: 'Almost done… thanks for waiting!' },
		{ delay: 20000, text: 'Still working… slow internet might be the reason.' },
		{ delay: 30000, text: 'Hmm, something might’ve gone wrong. You can try refreshing.' }
	];

	function resetMessages() {
		message = '';
		timeouts.forEach(clearTimeout);

		timeouts = [];

		// Show spinner after delay
		timeouts.push(
			setTimeout(() => {
				visible = true;
			}, delay)
		);

		// Schedule messages relative to start (after delay)
		for (const { delay: d, text } of messages) {
			timeouts.push(
				setTimeout(() => {
					message = text;
				}, d)
			);
		}
	}

	// keeps the stroke inside the 32x32 viewBox
	$: radius = 8 - strokeWidth / 2;

	$: ($page.url.pathname, resetMessages());

	onDestroy(() => {
		timeouts.forEach(clearTimeout);
	});
</script>

{#if visible}
	<div class={`flex flex-col items-center justify-center text-center ${inline ? '' : 'fixed inset-0'} ${margin}`}>
		<svg class="animate-spin w-{size} h-{size}" fill="none" viewBox="0 0 32 32">
			<path d="M16 {16 - radius} A {radius} {radius} 0 1 0 {16 + radius} 16" stroke-width={strokeWidth} stroke-linecap="round" class="stroke-theme-accent" />
		</svg>

		{#if !hideMessages && message}
			<p class="text-xs mt-2">{message}</p>
		{/if}
	</div>
{/if}
