<script>
	import { createEventDispatcher } from 'svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';

	const dispatch = createEventDispatcher();

	export let bookmark;
	export let fullQuranTextData = null;
	export let cardInnerClasses;
	export let isMenuOpen = false;

	// Parse bookmark reference
	const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number);
	const chapterMeta = quranMetaData[bookmarkChapter];
	const maxTextLength = 'max-w-[28vw] md:max-w-[115px]';

	function handleToggleMenu(event) {
		event.preventDefault();
		event.stopPropagation();
		dispatch('toggleMenu', { bookmark });
	}

	function handleDeleteBookmark(event) {
		event.stopPropagation();
		
		showConfirm(
			`Are you sure you want to delete this bookmark (${bookmark})?`,
			null,
			() => {
				updateSettings({ type: 'userBookmarks', key: bookmark });
				window.umami?.track('Delete Bookmark Menu');
			}
		);
	}
</script>

<div 
	class="relative bookmark-menu-container {cardInnerClasses} !p-0 overflow-visible"
	role="article"
	aria-label="Bookmark for {chapterMeta.transliteration} verse {bookmarkVerse}"
>
	<a 
		href="{bookmarkChapter}?startVerse={bookmarkVerse}" 
		class="!justify-start flex flex-col w-full p-5 {isMenuOpen ? 'pointer-events-none' : ''}"
		aria-label="Go to {chapterMeta.transliteration} verse {bookmarkVerse}"
	>
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
	<button
		on:click={handleToggleMenu}
		class="absolute top-2 right-2 p-1 rounded-full {window.theme('hover')} opacity-70 hover:opacity-100 transition-opacity z-10"
		aria-label={isMenuOpen ? 'Close menu' : 'Open options menu'}
		aria-expanded={isMenuOpen}
		aria-haspopup="true"
	>
		<DotsHorizontal size={5} />
	</button>

	<!-- Dropdown menu -->
	{#if isMenuOpen}
		<div 
			class="absolute bottom-20 right-2 rounded-xl shadow-lg border overflow-hidden z-20 px-2 py-2 {window.theme('bgMain')} {window.theme('border')}"
			style="min-width: 120px;"
			role="menu"
			aria-label="Bookmark options"
		>
			<button
				on:click={handleDeleteBookmark}
				class="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 rounded-3xl {window.theme('hover')} transition-colors"
				role="menuitem"
				aria-label="Delete bookmark"
			>
				<Trash size={4} aria-hidden="true" />
				<span>Delete</span>
			</button>
		</div>
	{/if}
</div>
