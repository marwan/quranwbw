<script>
	import { onMount } from 'svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkCard from '$display/BookmarkCard.svelte';
	import { __userBookmarks } from '$utils/stores';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { term } from '$utils/terminologies';

	export let cardGridClasses;
	export let cardInnerClasses;

	const MAX_HEIGHT = 250;
	const FADE_HEIGHT = 50;

	let fullQuranTextData = null;
	let bookmarkContainer;
	let fadePixels = FADE_HEIGHT;
	let forceCloseDropdowns = 0;

	$: hasBookmarks = $__userBookmarks.length > 0;

	$: if (hasBookmarks && !fullQuranTextData) {
		loadQuranData();
	}

	onMount(() => {
		if (!bookmarkContainer) return;

		const resizeObserver = new ResizeObserver(() => {
			updateFade();
		});

		resizeObserver.observe(bookmarkContainer);
		updateFade();

		return () => {
			resizeObserver.disconnect();
		};
	});

	async function loadQuranData() {
		try {
			fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, 'other');
		} catch (error) {
			console.warn('Failed to load Quran data:', error);
		}
	}

	function updateFade({ closeDropdowns = false } = {}) {
		if (!bookmarkContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = bookmarkContainer;
		const maxScroll = scrollHeight - clientHeight;

		if (maxScroll <= 0) {
			// No scrollable overflow: no fade needed
			fadePixels = 0;
			return;
		}

		// Calculate how close we are to the bottom (0 = top, 1 = bottom)
		const scrollProgress = scrollTop / maxScroll;

		fadePixels = Math.max(0, Math.min(FADE_HEIGHT, FADE_HEIGHT * (1 - scrollProgress)));

		if (closeDropdowns) {
			forceCloseDropdowns += 1;
		}
	}

	function handleScroll() {
		updateFade({ closeDropdowns: true });
	}
</script>

<div class="relative">
	<div
		id="bookmark-cards"
		bind:this={bookmarkContainer}
		on:scroll={handleScroll}
		class="flex flex-col space-y-4 overflow-y-scroll no-scrollbar-scroll-container"
		style="max-height: {MAX_HEIGHT}px; mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%);"
	>
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
						<BookmarkCard {bookmark} {fullQuranTextData} {cardInnerClasses} forceClose={forceCloseDropdowns} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
