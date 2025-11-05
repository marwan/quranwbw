<script>
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import EditIcon from '$svgs/Edit.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { __verseKey, __notesModalVisible } from '$utils/stores';

	export let verse;
	export let note;
	export let cardInnerClasses;

	let dropdownOpen = false;
	const dropdownItemClasses = `flex flex-row items-center space-x-2 font-normal rounded-3xl ${window.theme('hover')}`;

	// Parse verse reference
	const [chapter, verseNumber] = verse.split(':').map(Number);
	const chapterMeta = quranMetaData[chapter];
	const maxTextLength = 'max-w-[30vw] md:max-w-[115px]';

	function handleEditNote(event) {
		event.preventDefault();
		event.stopPropagation();

		__verseKey.set(verse);
		__notesModalVisible.set(true);
		window.umami?.track('Edit Note Menu');
	}

	function handleDeleteNote(event) {
		event.preventDefault();
		event.stopPropagation();

		showConfirm(`Are you sure you want to delete this note (${verse})?`, null, () => {
			updateSettings({
				type: 'userNotes',
				key: verse,
				value: ''
			});
			window.umami?.track('Delete Note Menu');
		});
	}

	function handleCardClick(event) {
		if (dropdownOpen) {
			event.preventDefault();
		}
	}
</script>

<div class="relative note-menu-container {cardInnerClasses} !p-0 overflow-visible {dropdownOpen ? '!border-transparent' : ''}" role="article" aria-label="Note for {chapterMeta.transliteration} verse {verseNumber}">
	<a href="{chapter}?startVerse={verseNumber}" class="!justify-start flex flex-col w-full p-5 {dropdownOpen ? 'pointer-events-none' : ''}" aria-label="Go to {chapterMeta.transliteration} verse {verseNumber}" on:click={handleCardClick}>
		<div class="text-sm truncate {maxTextLength}">
			{chapterMeta.transliteration} ({verse})
		</div>

		<span class="text-xs truncate opacity-70 mt-2 {maxTextLength}">
			{note.note}
		</span>
	</a>

	<!-- Options menu button -->
	<button on:click={dropdownOpen} class="absolute top-2 right-2 p-1 rounded-full {window.theme('hover')} opacity-70 hover:opacity-100 transition-opacity z-10" aria-label={dropdownOpen ? 'Close menu' : 'Open options menu'} aria-expanded={dropdownOpen} aria-haspopup="true">
		<DotsHorizontal size={5} />
	</button>

	<Dropdown bind:open={dropdownOpen} containerClass="divide-y z-[1000]" class="px-2 my-2 w-max text-left font-sans direction-ltr">
		<DropdownItem class={dropdownItemClasses} on:click={handleEditNote}>
			<EditIcon size={4} aria-hidden="true" />
			<span>Edit</span>
		</DropdownItem>

		<DropdownItem class={dropdownItemClasses} on:click={handleDeleteNote}>
			<Trash size={4} aria-hidden="true" />
			<span>Delete</span>
		</DropdownItem>
	</Dropdown>
</div>
