<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __currentPage, __chapterNumber, __audioSettings, __verseKey, __notesData, __userNotes, __notesModalVisible } from '$utils/stores';
	import { buttonClasses, buttonOutlineClasses } from '$data/commonClasses';
	import { timeAgo } from '$utils/timeAgo';
	import { updateSettings } from '$utils/updateSettings';
	import { getModalTransition } from '$utils/getModalTransition';

	// Variables to hold the current note and modification time
	let verseNote, noteModifiedAt;

	// Extract chapter number from verse key
	$: chapter = $__verseKey.split(':')[0];

	// Reactive block to update note details and validation states
	$: {
		// Initialize note details as null by default
		verseNote = null;
		noteModifiedAt = null;

		// Update note details if a note exists for the current key
		if ($__userNotes.hasOwnProperty($__verseKey)) {
			verseNote = $__userNotes[$__verseKey].note;
			noteModifiedAt = timeAgo($__userNotes[$__verseKey].modified_at);

			// Re-run the block when notes modal visibility changes
			$__notesModalVisible;
		}

		// Set default modification time if undefined
		if (noteModifiedAt === undefined) {
			noteModifiedAt = 'just now';
		}
	}

	// Function to update the note
	function updateNote() {
		const notesValue = document.getElementById('notes-value').value;
		updateSettings({
			type: 'userNotes',
			key: $__verseKey,
			value: notesValue,
			set: true
		});
	}

	// Function to reset the note
	function resetNote() {
		verseNote = '';
		updateSettings({
			type: 'userNotes',
			key: $__verseKey,
			value: '',
			set: true
		});
	}
</script>

<Modal id="notesModal" bind:open={$__notesModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<!-- Modal content -->
	<h3 id="notes-modal-title" class="mb-8 text-xl font-medium">{quranMetaData[chapter].transliteration}, {$__verseKey}</h3>
	<textarea id="notes-value" rows="8" value={verseNote} class="block p-2.5 w-full text-sm rounded-3xl bg-transparent border {window.theme('border')} {window.theme('input')} {window.theme('placeholder')}" placeholder="Write your thoughts here..."></textarea>

	{#if noteModifiedAt !== null}
		<div id="notes-last-modified" class="text-xs mt-4">Modified {noteModifiedAt}.</div>
	{/if}

	<div class="flex flex-row">
		<button on:click={() => updateNote()} class="w-full mr-2 mt-6 {buttonClasses}">Update</button>
		<button on:click={() => resetNote()} class="w-fit mr-2 mt-6 {buttonOutlineClasses}">
			<span><Trash size={5} /></span>
		</button>
	</div>
</Modal>

<style>
	#notes-value {
		resize: none;
	}
</style>
