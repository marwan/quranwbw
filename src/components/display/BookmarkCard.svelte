<script>
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';

	export let bookmark;
	export let fullQuranTextData = null;
	export let cardInnerClasses;

	let dropdownOpen = false;
	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;

	// Parse bookmark reference
	const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number);
	const chapterMeta = quranMetaData[bookmarkChapter];
	const maxTextLength = 'max-w-[28vw] md:max-w-[115px]';

	function handleDeleteBookmark(event) {
		event.stopPropagation();

		showConfirm(`Are you sure you want to delete this bookmark (${bookmark})?`, null, () => {
			updateSettings({ type: 'userBookmarks', key: bookmark });
			window.umami?.track('Delete Bookmark Menu');
		});
	}
</script>

<div class="relative bookmark-menu-container {cardInnerClasses} !p-0 overflow-visible" role="article" aria-label="Bookmark for {chapterMeta.transliteration} verse {bookmarkVerse}">
	<a href="{bookmarkChapter}?startVerse={bookmarkVerse}" class="!justify-start flex flex-col w-full p-5 {dropdownOpen ? 'pointer-events-none' : ''}" aria-label="Go to {chapterMeta.transliteration} verse {bookmarkVerse}">
		<div class="text-sm truncate {maxTextLength}">
			{chapterMeta.transliteration} ({bookmark})
		</div>

		{#if fullQuranTextData}
			<div class="text-sm truncate text-right direction-rtl arabic-font-1 opacity-70 mt-2">
				{#await fullQuranTextData then data}
					{@const verseText = data.data[`${bookmarkChapter}:${bookmarkVerse}`]}
					<div class="truncate {maxTextLength}" lang="ar">
						{verseText}
					</div>
				{:catch _error}
					<span class="text-xs opacity-50" role="alert">Failed to load verse</span>
				{/await}
			</div>
		{/if}
	</a>

	<!-- Options menu button -->
	<button on:click={dropdownOpen} class="absolute top-2 right-2 p-1 rounded-full {window.theme('hover')} opacity-70 hover:opacity-100 transition-opacity z-10" aria-label={dropdownOpen ? 'Close menu' : 'Open options menu'} aria-expanded={dropdownOpen} aria-haspopup="true">
		<DotsHorizontal size={5} />
	</button>

	<Dropdown bind:open={dropdownOpen} class="px-2 my-2 w-max text-left font-sans direction-ltr">
		<DropdownItem class={dropdownItemClasses} on:click={handleDeleteBookmark}>
			<Trash size={4} aria-hidden="true" />
			<span>Delete</span>
		</DropdownItem>
	</Dropdown>
</div>
