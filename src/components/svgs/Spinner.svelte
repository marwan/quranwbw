<script>
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';

	export let size = '16';
	export let margin = '';
	export let inline = false;
	export let delay = 200;
	export let hideMessages = false;

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

	$: $page.url.pathname, resetMessages();

	onDestroy(() => {
		timeouts.forEach(clearTimeout);
	});
</script>

{#if visible}
	<div class={`flex flex-col items-center justify-center text-center ${inline ? '' : 'fixed inset-0'} ${margin}`}>
		<svg class="animate-spin w-{size} h-{size}" fill="none" viewBox="0 0 32 32">
			<path clip-rule="evenodd" d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z" fill={window.theme('icon')} fill-rule="evenodd" />
		</svg>

		{#if !hideMessages && message}
			<p class="text-xs mt-2">{message}</p>
		{/if}
	</div>
{/if}
