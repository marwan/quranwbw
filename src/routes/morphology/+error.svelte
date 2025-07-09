<script>
	import { page } from '$app/stores';
	import { __currentPage } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';

	__currentPage.set('error');
</script>

<div class="flex flex-col space-y-4 items-center justify-center text-center pt-28">
	{#if $page.status === 404}
		<span>The content you were looking for was not found.</span>
	{:else}
		<span>There was an error while loading the content. Please try again later.</span>
	{/if}

	<span>If you think this error shouldn't occur, please let us know via <a class={linkClasses} href="mailto:quranwbw@gmail.com">email</a>.</span>

	<a class="{linkClasses} pt-8" href="/">Go back to homepage.</a>
</div>
