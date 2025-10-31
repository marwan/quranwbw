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

	const MAX_HEIGHT = 250; // Around 2 cards and a half
	const FADE_HEIGHT = 50; // Fade effect height

	let fullQuranTextData = null;
	let openMenuBookmark = null;
	let isLoading = false;
	let _error = null;

	$: hasBookmarks = $__userBookmarks.length > 0;

	// Fetch Quran data when bookmarks exist
	onMount(() => {
		if (hasBookmarks) {
			loadQuranData();
		}
	});

	// Reload data when bookmarks change from 0 to >0
	$: if (hasBookmarks && !fullQuranTextData && !isLoading) {
		loadQuranData();
	}

	async function loadQuranData() {
		isLoading = true;
		_error = null;
		
		try {
			fullQuranTextData = await fetchAndCacheJson(
				`${staticEndpoint}/full-quran/uthmani.json?version=1`,
				'other'
			);
		} catch (err) {
			_error = err;
			console.error('Failed to load Quran data:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleMenuToggle(event) {
		openMenuBookmark = event.detail.bookmark;
	}

	function handleClickOutside(event) {
		if (openMenuBookmark && !event.target.closest('.bookmark-menu-container')) {
			openMenuBookmark = null;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div id="bookmark-cards" class="flex flex-col space-y-4">
	{#if !hasBookmarks}
		<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
			<span>
				You haven't bookmarked any {term('verse')} yet! Start by clicking on the 
				<Bookmark classes="inline mt-[-4px]" /> icon for an {term('verse')}. 
				It's a perfect way to return to the {term('verses')} that resonate with you.
			</span>
		</div>
	{:else}
		<div 
			class="overflow-y-auto no-scrollbar-scroll-container"
			style="max-height: {MAX_HEIGHT}px; mask-image: linear-gradient(to bottom, black calc(100% - {FADE_HEIGHT}px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black calc(100% - {FADE_HEIGHT}px), transparent 100%);"
		>
			<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
				{#each $__userBookmarks as bookmark (bookmark)}
					<BookmarkCard 
						{bookmark}
						{fullQuranTextData}
						{cardInnerClasses}
						isMenuOpen={openMenuBookmark === bookmark}
						on:toggleMenu={handleMenuToggle}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
