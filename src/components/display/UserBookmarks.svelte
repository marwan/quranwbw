<script>
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkCard from '$display/BookmarkCard.svelte';
	import ScrollableFadeContainer from '$display/ScrollableFadeContainer.svelte';
	import { __userBookmarks } from '$utils/stores';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { term } from '$utils/terminologies';

	export let cardGridClasses;
	export let cardInnerClasses;

	let fullQuranTextData = null;
	let forceCloseDropdowns = 0;

	$: hasBookmarks = $__userBookmarks.length > 0;

	$: if (hasBookmarks && !fullQuranTextData) {
		loadQuranData();
	}

	async function loadQuranData() {
		try {
			fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, 'other');
		} catch (error) {
			console.warn(error);
		}
	}

	function handleScroll() {
		forceCloseDropdowns += 1;
	}
</script>

<ScrollableFadeContainer containerId="bookmark-cards" onScrollAction={handleScroll}>
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
</ScrollableFadeContainer>
