<script>
	import { onMount } from 'svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkCard from '$display/BookmarkCard.svelte';
	import { __userBookmarks } from '$utils/stores';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { term } from '$utils/terminologies';

	export let cardGridClasses;
	export let cardInnerClasses;

	let fullQuranTextData = null;
	let isLoading = false;
	let bookmarkContainer;
	let showFade = false; // fade visibility state

	$: hasBookmarks = $__userBookmarks.length > 0;

	onMount(() => {
		if (hasBookmarks) loadQuranData();

		if (bookmarkContainer) {
			handleScroll(); // initialize fade state
			bookmarkContainer.addEventListener('scroll', handleScroll);
		}

		return () => {
			if (bookmarkContainer) {
				bookmarkContainer.removeEventListener('scroll', handleScroll);
			}
		};
	});

	$: if (hasBookmarks && !fullQuranTextData && !isLoading) {
		loadQuranData();
	}

	async function loadQuranData() {
		isLoading = true;
		try {
			fullQuranTextData = await fetchAndCacheJson(`${staticEndpoint}/full-quran/uthmani.json?version=1`, 'other');
		} catch (error) {
			console.error('Failed to load Quran data:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleScroll() {
		if (!bookmarkContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = bookmarkContainer;
		const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

		showFade = !isAtBottom;
	}
</script>

<div class="relative">
	<!-- Scrollable container -->
	<div id="bookmark-cards" bind:this={bookmarkContainer} class="flex flex-col space-y-4 max-h-64 overflow-y-scroll">
		{#if !hasBookmarks}
			<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
				<span>
					You haven't bookmarked any {term('verse')} yet! Start by clicking on the
					<Bookmark classes="inline mt-[-4px]" /> icon for an {term('verse')}. It's a perfect way to return to the {term('verses')} that resonate with you.
				</span>
			</div>
		{:else}
			<div>
				<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
					{#each $__userBookmarks as bookmark (bookmark)}
						<BookmarkCard {bookmark} {fullQuranTextData} {cardInnerClasses} />
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Fade overlay -->
	{#if showFade}
		<div class="fade-bottom"></div>
	{/if}
</div>

<style>
	.fade-bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40px;
		pointer-events: none;
		background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.15));
		transition: opacity 0.3s ease;
	}
</style>
