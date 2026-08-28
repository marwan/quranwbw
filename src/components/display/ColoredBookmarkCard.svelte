<script>
	export let bookmark;
	export let fullQuranTextData = null;
	export let cardInnerClasses;
	export let forceClose = 0;
	export let colorId;

	import Portal from 'svelte-portal';
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { COLOR_TOKENS, isDarkTheme } from '$utils/coloredBookmarks';
	import { __websiteTheme } from '$utils/stores';

	const dispatch = createEventDispatcher();
	const dropdownItemClasses = 'flex flex-row items-center space-x-2 font-normal rounded-3xl hover:bg-theme-accent/5';
	const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number);
	const chapterMeta = quranMetaData[bookmarkChapter];
	const maxTextLength = 'max-w-[28vw] md:max-w-[115px]';

	let dropdownOpen = false;
	let buttonElement;
	let hasMounted = false;
	let previousOpen = dropdownOpen;
	let previousForceClose = forceClose;

	$: isDark = isDarkTheme($__websiteTheme);
	$: token = COLOR_TOKENS[colorId];
	$: accentHex = token ? (isDark ? token.darkHex : token.lightHex) : 'transparent';

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
			buttonElement?.blur();
		}
	}

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function handleClearColor(event) {
		event.stopPropagation();
		const name = token?.name ?? `color ${colorId}`;
		showConfirm(`Remove ${name} color from ${bookmark}?`, null, () => {
			updateSettings({ type: 'userColoredBookmarks', key: bookmark, clear: true });
			window.umami?.track('Clear Colored Bookmark Card', { verseKey: bookmark, colorId });
		});
	}
</script>

<div
	class="relative bookmark-menu-container {cardInnerClasses} !p-0 overflow-visible {dropdownOpen ? '!border-transparent' : ''}"
	role="article"
	aria-label="Colored bookmark for {chapterMeta.transliteration} verse {bookmarkVerse} in {token?.name ?? ''}"
	style="border-left-width: 4px; border-left-color: {accentHex}; border-left-style: solid;"
>
	<a
		href="/{bookmarkChapter}?startVerse={bookmarkVerse}"
		class="!justify-start flex flex-col w-full p-5 {dropdownOpen ? 'pointer-events-none' : ''}"
		aria-label="Go to {chapterMeta.transliteration} verse {bookmarkVerse}"
	>
		<div class="text-sm truncate {maxTextLength} flex items-center gap-2">
			<span>{chapterMeta.transliteration} ({bookmark})</span>
			<span class="w-2.5 h-2.5 rounded-full border border-theme-accent/20 inline-block" style="background-color: {accentHex}" aria-hidden="true"></span>
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
		id="colored-bookmark-menu-{bookmark.replace(':', '-')}-{colorId}"
		bind:this={buttonElement}
		on:click|stopPropagation={toggleDropdown}
		on:touchend|preventDefault|stopPropagation={toggleDropdown}
		class="absolute top-2 right-2 p-1 rounded-full hover:bg-theme-accent/5 opacity-70 hover:opacity-100 transition-opacity z-10 focus:outline-none"
		aria-label={dropdownOpen ? 'Close menu' : 'Open options menu'}
		aria-expanded={dropdownOpen}
		aria-haspopup="true"
	>
		<DotsHorizontal size={5} />
	</button>
</div>

{#if buttonElement}
	<Portal target="body">
		<Dropdown
			bind:open={dropdownOpen}
			triggeredBy="#colored-bookmark-menu-{bookmark.replace(':', '-')}-{colorId}"
			strategy="fixed"
			containerClass={`divide-y z-[1000] shadow-md border border-theme-accent/20`}
			class="px-2 my-2 w-max text-left font-sans direction-ltr"
		>
			<DropdownItem class={dropdownItemClasses} on:click={handleClearColor}>
				<Trash size={4} aria-hidden="true" />
				<span>Clear color</span>
			</DropdownItem>
		</Dropdown>
	</Portal>
{/if}
