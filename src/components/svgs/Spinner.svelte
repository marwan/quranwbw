<script>
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';

	export let size = '16';
	export let height = 'fit';
	export let margin = '';

	let message = '';
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
		timeouts = messages.map(({ delay, text }) =>
			setTimeout(() => {
				message = text;
			}, delay)
		);
	}

	// Reactively run resetMessages whenever $page changes
	$: $page.url.pathname, resetMessages();

	// Clean up on component destroy
	onDestroy(() => {
		timeouts.forEach(clearTimeout);
	});
</script>

<div class="flex flex-col m-auto h-{height} {margin} justify-center items-center text-center">
	<svg class="animate-spin w-{size} h-{size}" fill="none" viewBox="0 0 32 32">
		<path clip-rule="evenodd" d="M15.165 8.53a.5.5 0 01-.404.58A7 7 0 1023 16a.5.5 0 011 0 8 8 0 11-9.416-7.874.5.5 0 01.58.404z" fill={window.theme('icon')} fill-rule="evenodd" />
	</svg>

	{#if message}
		<p class="text-xs">{message}</p>
	{/if}
</div>
