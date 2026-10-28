<script>
	import NotFound from '$svgs/NotFound.svelte';
	import PageHead from '$misc/PageHead.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { __currentPage } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';

	$: is404 = $page.status === 404;

	// safe wrapper in case the rybbit script is blocked or not loaded
	function track(name, props = {}) {
		try {
			window.rybbit?.event(name, props);
		} catch (error) {
			console.warn(error);
		}
	}

	// track the error once on load
	onMount(() => {
		track(is404 ? '404' : 'error', {
			status: $page.status,
			path: $page.url.pathname,
			message: $page.error?.message || '',
			referrer: document.referrer || 'direct'
		});
	});

	__currentPage.set('error');
</script>

<PageHead title={is404 ? 'Page not found' : 'Something went wrong'} />

<!-- keep error pages out of search results since the response status is 200 -->
<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="fixed inset-0 flex flex-col space-y-6 items-center justify-center text-center px-4 pointer-events-none">
	<span><NotFound size={12} /></span>

	<p class="text-sm opacity-70">
		{#if is404}
			The content you were looking for was not found.
		{:else}
			There was an error while loading the content. Please try again later.
		{/if}
	</p>

	<p class="text-sm opacity-70 pointer-events-auto">
		If you think this error shouldn't occur, please let us know via <a class={linkClasses} href="mailto:quranwbw@gmail.com" on:click={() => track('Error Page Email Clicked')}>email</a> or join our <a class={linkClasses} href="https://discord.gg/VSGJKsarxW" target="_blank" rel="noopener noreferrer" on:click={() => track('Error Page Discord Clicked')}>Discord server</a>.
	</p>
</div>
