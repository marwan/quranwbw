<script>
	import Portal from 'svelte-portal';
	import { createEventDispatcher, onMount } from 'svelte';
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
	export let forceClose = 0; // Reactive prop to force close dropdown

	const dispatch = createEventDispatcher();

	let dropdownOpen = false;
	let buttonElement;
	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;
	let hasMounted = false;
	let previousOpen = dropdownOpen;
	let previousForceClose = forceClose;

	// Parse bookmark reference
	const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number);
	const chapterMeta = quranMetaData[bookmarkChapter];
	const maxTextLength = 'max-w-[28vw] md:max-w-[115px]';

	// Watch forceClose to close dropdown when parent scrolls
	onMount(() => {
		hasMounted = true;
		previousOpen = dropdownOpen;
	});

	$: if (hasMounted && dropdownOpen !== previousOpen) {
		previousOpen = dropdownOpen;
		dispatch('toggle', { bookmark, open: dropdownOpen });
	}

	$: if (forceClose !== previousForceClose) {
		previousForceClose = forceClose;
		if (dropdownOpen) {
			dropdownOpen = false;
			buttonElement?.blur(); // Clear focus so Flowbite stays closed
		}
	}

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function handleDeleteBookmark(event) {
		event.stopPropagation();

		showConfirm(`Are you sure you want to delete this bookmark (${bookmark})?`, null, () => {
			updateSettings({ type: 'userBookmarks', key: bookmark });
			window.umami?.track('Delete Bookmark Menu');
		});
	}
</script>

<div class="relative bookmark-menu-container {cardInnerClasses} !p-0 overflow-visible {dropdownOpen ? '!border-transparent' : ''}" role="article" aria-label="Bookmark for {chapterMeta.transliteration} verse {bookmarkVerse}">
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
	<button id="bookmark-menu-{bookmark.replace(':', '-')}" bind:this={buttonElement} on:click|stopPropagation={toggleDropdown} class="absolute top-2 right-2 p-1 rounded-full {window.theme('hover')} opacity-70 hover:opacity-100 transition-opacity z-10 focus:outline-none" aria-label={dropdownOpen ? 'Close menu' : 'Open options menu'} aria-expanded={dropdownOpen} aria-haspopup="true">
		<DotsHorizontal size={5} />
	</button>
</div>

{#if buttonElement}
	<Portal target="body">
		<Dropdown bind:open={dropdownOpen} triggeredBy="#bookmark-menu-{bookmark.replace(':', '-')}" strategy="fixed" containerClass="divide-y z-[1000]" class="px-2 my-2 w-max text-left font-sans direction-ltr">
			<DropdownItem class={dropdownItemClasses} on:click={handleDeleteBookmark}>
				<Trash size={4} aria-hidden="true" />
				<span>Delete</span>
			</DropdownItem>
		</Dropdown>
	</Portal>
{/if}
