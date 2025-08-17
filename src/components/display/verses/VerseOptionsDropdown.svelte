<script>
	export let page;

	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import Play from '$svgs/Play.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkFilled from '$svgs/BookmarkFilled.svelte';
	import Notes from '$svgs/Notes.svelte';
	import NotesFilled from '$svgs/NotesFilled.svelte';
	import Tafsir from '$svgs/Tafsir.svelte';
	import VerseTranslation from '$svgs/VerseTranslation.svelte';
	import ChapterMode from '$svgs/ChapterMode.svelte';
	import Book from '$svgs/Book.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Copy from '$svgs/Copy.svelte';
	import { showAudioModal } from '$utils/audioController';
	import { selectableDisplays } from '$data/options';
	import { __userSettings, __verseKey, __notesModalVisible, __tafsirModalVisible, __morphologyModalVisible, __verseTranslationModalVisible, __copyShareVerseModalVisible, __currentPage, __displayType, __userNotes, __fontType, __morphologyKey } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { term } from '$utils/terminologies';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	// Constants
	const mushafFontTypes = [2, 3];
	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;

	// Component state
	let dropdownOpen = false;
	let subMenuVisible = false;

	// Computed values
	$: [chapter, verse] = $__verseKey.split(':').map(Number);
	$: userBookmarks = JSON.parse($__userSettings).userBookmarks;
	$: isBookmarked = userBookmarks.includes($__verseKey);
	$: hasNotes = Object.prototype.hasOwnProperty.call($__userNotes, $__verseKey);

	// Event handlers
	const handleAdvancedPlay = () => {
		showAudioModal($__verseKey);
		dropdownOpen = false;
	};

	const handleBookmark = () => {
		updateSettings({ type: 'userBookmarks', key: $__verseKey, set: true });
	};

	const handleNotes = () => {
		__notesModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleTranslation = () => {
		__verseTranslationModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleTafsir = () => {
		__tafsirModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleMorphology = () => {
		__morphologyKey.set($__verseKey);
		__morphologyModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleCopy = () => {
		__copyShareVerseModalVisible.set(true);
		dropdownOpen = false;
	};

	// Track analytics
	const trackEvent = (eventName) => {
		window.umami.track(eventName);
	};

	// Menu items configuration
	$: menuItems = [
		{
			id: 'play',
			icon: Play,
			text: 'Advanced Play',
			handler: handleAdvancedPlay,
			analyticsEvent: 'Advanced Play Modal Button',
			show: true
		},
		{
			id: 'bookmark',
			icon: isBookmarked ? BookmarkFilled : Bookmark,
			text: isBookmarked ? 'Unbookmark' : 'Bookmark',
			handler: handleBookmark,
			analyticsEvent: 'Bookmark Verse Button',
			show: true
		},
		{
			id: 'notes',
			icon: hasNotes ? NotesFilled : Notes,
			text: 'Notes',
			handler: handleNotes,
			analyticsEvent: 'Verse Notes Modal Button',
			show: true
		},
		{
			id: 'translation',
			icon: VerseTranslation,
			text: 'Translation',
			handler: handleTranslation,
			analyticsEvent: 'Verse Translation Modal Button',
			show: selectableDisplays[$__displayType].continuous
		},
		{
			id: 'tafsir',
			icon: Tafsir,
			text: term('tafsir'),
			handler: handleTafsir,
			analyticsEvent: 'Verse Tafsir Modal Button',
			show: true
		},
		{
			id: 'morphology',
			icon: Morphology,
			text: 'Morphology',
			handler: handleMorphology,
			analyticsEvent: 'Verse Morphology Modal Button',
			show: true
		},
		{
			id: 'copy',
			icon: Copy,
			text: 'Copy',
			handler: handleCopy,
			analyticsEvent: 'Copy Verse Modal Button',
			show: !mushafFontTypes.includes($__fontType)
		}
	];

	// Mode switching items
	$: modeItems =
		$__currentPage === 'mushaf'
			? [
					{
						href: `/${chapter}?startVerse=${verse}`,
						icon: ChapterMode,
						text: `${term('chapter')} Mode`,
						analyticsEvent: 'Chapter Mode Button'
					}
				]
			: [
					{
						href: `/page/${page}`,
						icon: Book,
						text: 'Mushaf Mode',
						analyticsEvent: 'Mushaf Mode Button'
					}
				];
</script>

<Dropdown bind:open={dropdownOpen} class="px-2 mr-2 my-2 w-max text-left font-sans direction-ltr">
	<div class="py-2 px-4 text-xs font-semibold text-left">
		{term('verse')}
		{$__verseKey}
	</div>

	{#if !subMenuVisible}
		<div transition:fly={{ duration: 0, x: 0, easing: sineIn }}>
			<!-- Main menu items -->
			{#each menuItems as item (item.id)}
				{#if item.show}
					<DropdownItem class={dropdownItemClasses} on:click={item.handler} data-umami-event={item.analyticsEvent}>
						<svelte:component this={item.icon} />
						<span>{item.text}</span>
					</DropdownItem>
				{/if}
			{/each}

			<!-- Mode switching items -->
			{#each modeItems as item}
				<DropdownItem class={dropdownItemClasses} href={item.href} on:click={() => trackEvent(item.analyticsEvent)}>
					<svelte:component this={item.icon} />
					<span>{item.text}</span>
				</DropdownItem>
			{/each}
		</div>
	{/if}
</Dropdown>
