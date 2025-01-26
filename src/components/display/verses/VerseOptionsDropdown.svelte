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
	import Juz from '$svgs/Juz.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Copy from '$svgs/Copy.svelte';
	import AdvancedCopy from '$svgs/AdvancedCopy.svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Back from '$svgs/Back.svelte';
	import Link from '$svgs/Link.svelte';
	import { showAudioModal } from '$utils/audioController';
	import { selectableDisplays } from '$data/options';
	import { __userSettings, __verseKey, __notesModalVisible, __tafsirModalVisible, __morphologyModalVisible, __verseTranslationModalVisible, __copyShareVerseModalVisible, __currentPage, __displayType, __userNotes, __fontType, __morphologyKey } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { term } from '$utils/terminologies';
	import { staticEndpoint } from '$data/websiteSettings';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	// Transition parameters for drawer
	const transitionParamsRight = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;
	let dropdownOpen = false;
	let subMenuVisible = false;
	let verseKeyData;

	$: [chapter, verse] = $__verseKey.split(':').map(Number);

	// Update userBookmarks whenever the __userSettings changes
	$: userBookmarks = JSON.parse($__userSettings).userBookmarks;

	// Load verse key data externally to reduce bundle size
	$: {
		if (dropdownOpen) {
			verseKeyData = (async () => {
				// getting indexes file
				const response = await fetch(`${staticEndpoint}/meta/verseKeyData.json?version=2`);
				const data = await response.json();
				return data;
			})();
		}
	}
</script>

<Dropdown bind:open={dropdownOpen} class="px-2 mr-2 my-2 w-max text-left font-sans direction-ltr">
	<div class="py-2 px-4 text-xs font-semibold text-left">{term('verse')} {$__verseKey}</div>

	{#if !subMenuVisible}
		<!-- play verse button -->
		<DropdownItem
			class={dropdownItemClasses}
			on:click={() => {
				showAudioModal($__verseKey);
				dropdownOpen = false;
			}}
			data-umami-event="Advanced Play Modal Button"
		>
			<Play />
			<span>Advanced Play</span>
		</DropdownItem>

		<!-- bookmark button -->
		<DropdownItem class={dropdownItemClasses} on:click={() => updateSettings({ type: 'userBookmarks', key: $__verseKey, set: true })} data-umami-event="Bookmark Verse Button">
			<svelte:component this={userBookmarks.includes($__verseKey) ? BookmarkFilled : Bookmark} />
			<span>{userBookmarks.includes($__verseKey) ? 'Unbookmark' : 'Bookmark'}</span>
		</DropdownItem>

		<!-- verse notes button -->
		<DropdownItem
			class={dropdownItemClasses}
			on:click={() => {
				__notesModalVisible.set(true);
				dropdownOpen = false;
			}}
			data-umami-event="Verse Notes Modal Button"
		>
			<svelte:component this={$__userNotes.hasOwnProperty($__verseKey) ? NotesFilled : Notes} />
			<span>Notes</span>
		</DropdownItem>
	{/if}

	<!-- more options button -->
	<!-- <DropdownItem
		class={dropdownItemClasses}
		on:click={() => {
			subMenuVisible = !subMenuVisible;
		}}
	>
		{#if subMenuVisible}
			<Back />
			<span>Go Back</span>
		{:else}
			<DotsHorizontal />
			<span>More Options</span>
		{/if}
	</DropdownItem> -->

	{#if !subMenuVisible}
		<div transition:fly={{ duration: 0, x: 0, easing: sineIn }}>
			<!-- verse translation button - only show on Mushaf page or on continuous display -->
			{#if selectableDisplays[$__displayType].continuous}
				<DropdownItem
					class={dropdownItemClasses}
					on:click={() => {
						__verseTranslationModalVisible.set(true);
						dropdownOpen = false;
					}}
					data-umami-event="Verse Translation Modal Button"
				>
					<VerseTranslation />
					<span>Translation</span>
				</DropdownItem>
			{/if}

			<!-- tafsir button -->
			<DropdownItem
				class={dropdownItemClasses}
				on:click={() => {
					__tafsirModalVisible.set(true);
					dropdownOpen = false;
				}}
				data-umami-event="Verse Tafsir Modal Button"
			>
				<Tafsir />
				<span>{term('tafsir')}</span>
			</DropdownItem>

			<!-- mode change buttons -->
			{#if $__currentPage === 'mushaf'}
				<DropdownItem class={dropdownItemClasses} href="/{chapter}?startVerse={verse}" on:click={() => window.umami.track('Chapter Mode Button')}>
					<ChapterMode />
					<span>{term('chapter')} Mode</span>
				</DropdownItem>
			{:else}
				<DropdownItem class={dropdownItemClasses} href="/page/{page}" on:click={() => window.umami.track('Mushaf Mode Button')}>
					<Book />
					<span>Mushaf Mode</span>
				</DropdownItem>
			{/if}

			<!-- only show results of key-pages if we have loaded the data -->
			<!-- {#if $__currentPage !== 'juz'}
				{#await verseKeyData then data}
					<DropdownItem class={dropdownItemClasses} href="/juz/{data[$__verseKey].juz}?startKey={$__verseKey}">
						<Juz />
						<span>Juz Mode</span>
					</DropdownItem>
				{/await}
			{/if} -->

			<!-- verse morphology button -->
			<DropdownItem
				class={dropdownItemClasses}
				on:click={() => {
					__morphologyKey.set($__verseKey);
					__morphologyModalVisible.set(true);
					dropdownOpen = false;
					window.umami.track('Verse Morphology Modal Button');
				}}
			>
				<Morphology />
				<span>Morphology</span>
			</DropdownItem>

			<!-- copy verse button (only for hafs digital and indopak) -->
			{#if [1, 4].includes($__fontType)}
				<DropdownItem
					class={dropdownItemClasses}
					on:click={() => {
						__copyShareVerseModalVisible.set(true);
						dropdownOpen = false;
					}}
					data-umami-event="Copy Verse Modal Button"
				>
					<Copy />
					<span>Copy</span>
				</DropdownItem>
			{/if}
		</div>
	{/if}
</Dropdown>
