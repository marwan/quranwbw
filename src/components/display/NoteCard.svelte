<script>
	export let verse;
	export let note;
	export let cardInnerClasses;
	export let forceClose = 0;

	import Portal from 'svelte-portal';
	import { createEventDispatcher, onMount } from 'svelte';
	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import EditIcon from '$svgs/Edit.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { __verseKey, __notesModalVisible } from '$utils/stores';
	import { dropdownItemClasses } from '$data/commonClasses';

	const dispatch = createEventDispatcher();

	// Dropdown state (previous values are used to detect changes in the reactive blocks below)
	let dropdownOpen = false;
	let buttonElement;
	let hasMounted = false;
	let previousOpen = dropdownOpen;
	let previousForceClose = forceClose;

	// Parse verse reference
	const [chapter, verseNumber] = verse.split(':').map(Number);
	const chapterMeta = quranMetaData[chapter];
	const maxTextLength = 'max-w-[30vw] md:max-w-[115px]';

	// Mark the component as mounted so the toggle event is not fired on initial render
	onMount(() => {
		hasMounted = true;
		previousOpen = dropdownOpen;
	});

	// Notify the parent whenever the dropdown opens or closes (after mount)
	$: if (hasMounted && dropdownOpen !== previousOpen) {
		previousOpen = dropdownOpen;
		dispatch('toggle', { verse, open: dropdownOpen });
	}

	// Close the dropdown when the parent changes the forceClose value
	$: if (forceClose !== previousForceClose) {
		previousForceClose = forceClose;
		if (dropdownOpen) {
			dropdownOpen = false;
			buttonElement?.blur(); // Clear focus so Flowbite stays closed
		}
	}

	// Toggles the dropdown open/closed
	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	// Opens the notes modal to edit this verse's note
	function handleEditNote(event) {
		event.preventDefault();
		event.stopPropagation();

		__verseKey.set(verse);
		__notesModalVisible.set(true);
		window.rybbit?.event('Edit Note Menu');
	}

	// Asks for confirmation, then clears the note
	function handleDeleteNote(event) {
		event.preventDefault();
		event.stopPropagation();

		showConfirm(`Are you sure you want to delete this note (${verse})?`, null, () => {
			updateSettings({
				type: 'userNotes',
				key: verse,
				value: ''
			});
			window.rybbit?.event('Delete Note Menu');
		});
	}

	// Prevents the card link from being followed while the dropdown is open
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
	<button id="note-menu-{verse.replace(':', '-')}" bind:this={buttonElement} on:click|stopPropagation={toggleDropdown} class="absolute top-2 right-2 p-1 rounded-full hover:bg-theme-accent/5 opacity-70 hover:opacity-100 transition-opacity z-10" aria-label={dropdownOpen ? 'Close menu' : 'Open options menu'} aria-expanded={dropdownOpen} aria-haspopup="true">
		<DotsHorizontal size={5} />
	</button>
</div>

{#if buttonElement}
	<Portal target="body">
		<Dropdown bind:open={dropdownOpen} triggeredBy="#note-menu-{verse.replace(':', '-')}" strategy="fixed" containerClass={`divide-y z-[1000] shadow-md border border-theme-accent/20`} class="px-2 my-2 w-max text-left font-sans direction-ltr">
			<DropdownItem class={dropdownItemClasses} on:click={handleEditNote}>
				<EditIcon size={4} aria-hidden="true" />
				<span>Edit</span>
			</DropdownItem>

			<DropdownItem class={dropdownItemClasses} on:click={handleDeleteNote}>
				<Trash size={4} aria-hidden="true" />
				<span>Delete</span>
			</DropdownItem>
		</Dropdown>
	</Portal>
{/if}
