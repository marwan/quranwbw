<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __verseKey, __userNotes, __notesModalVisible } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { timeAgo } from '$utils/timeAgo';
	import { updateSettings } from '$utils/updateSettings';
	import { getModalTransition } from '$utils/getModalTransition';
	import { showConfirm } from '$utils/confirmationAlertHandler';

	let verseNote,
		noteModifiedAt,
		updateButtonText,
		showDeleteButton = false;

	$: chapter = $__verseKey.split(':')[0];

	// Reactive block to update note details and validation states
	$: {
		// Initialize note details as null by default
		verseNote = null;
		noteModifiedAt = null;

		// Update note details if a note exists for the current key
		if (Object.prototype.hasOwnProperty.call($__userNotes, $__verseKey)) {
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

	// Update the button text accordingly
	$: if ($__notesModalVisible) {
		if (Object.prototype.hasOwnProperty.call($__userNotes, $__verseKey)) {
			updateButtonText = 'Update';
			showDeleteButton = true;
		} else {
			updateButtonText = 'Save';
			showDeleteButton = false;
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

<Modal id="notesModal" bind:open={$__notesModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">
		{quranMetaData[chapter].transliteration}, {$__verseKey}
	</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<textarea id="notes-value" rows="8" value={verseNote} class="block p-2.5 w-full text-sm rounded-3xl bg-transparent border {window.theme('border')} {window.theme('input')} {window.theme('placeholder')} resize-none" placeholder="Write your thoughts here..."></textarea>

		{#if noteModifiedAt !== null}
			<div id="notes-last-modified" class="text-xs mt-4">Modified {noteModifiedAt}.</div>
		{/if}
	</div>

	<div class="flex flex-row space-x-2 flex-shrink-0 mt-4">
		<button on:click={() => updateNote()} class="w-full {buttonClasses}">
			{updateButtonText}
		</button>

		{#if showDeleteButton}
			<button on:click={() => showConfirm('Are you sure you want to reset this note? This action cannot be undone.', 'notesModal', () => resetNote())} class="w-fit {buttonClasses}">
				<span><Trash size={5} /></span>
			</button>
		{/if}
	</div>
</Modal>
