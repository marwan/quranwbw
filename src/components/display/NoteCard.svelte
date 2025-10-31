<script>
	import { createEventDispatcher } from 'svelte';
	import DotsHorizontal from '$svgs/DotsHorizontal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import EditIcon from '$svgs/Edit.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { __verseKey, __notesModalVisible } from '$utils/stores';

	const dispatch = createEventDispatcher();

	export let verse;
	export let note;
	export let cardInnerClasses;
	export let isMenuOpen = false;

	// Parse verse reference
	const [chapter, verseNumber] = verse.split(':').map(Number);
	const chapterMeta = quranMetaData[chapter];
	const maxTextLength = 'max-w-[30vw] md:max-w-[115px]';

	function handleToggleMenu(event) {
		event.preventDefault();
		event.stopPropagation();
		dispatch('toggleMenu', { verse });
	}

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
		
		showConfirm(
			`Are you sure you want to delete this note (${verse})?`,
			null,
			() => {
				updateSettings({ 
					type: 'userNotes', 
					key: verse, 
					value: '' 
				});
				window.umami?.track('Delete Note Menu');
			}
		);
	}

	function handleCardClick(event) {
		if (isMenuOpen) {
			event.preventDefault();
		}
	}
</script>


<div 
	class="relative note-menu-container {cardInnerClasses} !p-0 overflow-visible"
	role="article"
	aria-label="Note for {chapterMeta.transliteration} verse {verseNumber}"
>
	<a 
		href="{chapter}?startVerse={verseNumber}" 
		class="!justify-start flex flex-col w-full p-5 {isMenuOpen ? 'pointer-events-none' : ''}"
		aria-label="Go to {chapterMeta.transliteration} verse {verseNumber}"
		on:click={handleCardClick}
	>
		<div class="text-sm truncate {maxTextLength}">
			{chapterMeta.transliteration} ({verse})
		</div>

		<span class="text-xs truncate opacity-70 mt-2 {maxTextLength}">
			{note.note}
		</span>
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
			aria-label="Note options"
		>
			<button
				on:click={handleEditNote}
				class="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 rounded-3xl {window.theme('hover')} transition-colors"
				role="menuitem"
				aria-label="Edit note"
			>
				<EditIcon size={4} aria-hidden="true" />
				<span>Edit</span>
			</button>
			
			<button
				on:click={handleDeleteNote}
				class="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 rounded-3xl {window.theme('hover')} transition-colors"
				role="menuitem"
				aria-label="Delete note"
			>
				<Trash size={4} aria-hidden="true" />
				<span>Delete</span>
			</button>
		</div>
	{/if}
</div>
