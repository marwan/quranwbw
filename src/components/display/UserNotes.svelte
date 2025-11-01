<script>
	import Notes from '$svgs/Notes.svelte';
	import NoteCard from '$display/NoteCard.svelte';
	import { __userNotes } from '$utils/stores';

	export let cardGridClasses;
	export let cardInnerClasses;

	const MAX_HEIGHT = 250; // Around 2 cards and a half
	const FADE_HEIGHT = 50; // Fade effect height

	$: hasNotes = Object.keys($__userNotes).length > 0;
	$: noteEntries = Object.entries($__userNotes);
</script>

<div id="note-cards" class="flex flex-col space-y-4">
	{#if !hasNotes}
		<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
			<span>
				You haven't saved any notes yet! Start jotting down your thoughts by clicking the
				<Notes classes="inline mt-[-4px]" /> icon. It's like creating your own personal treasure chest of wisdom.
			</span>
		</div>
	{:else}
		<div class="overflow-y-auto no-scrollbar-scroll-container" style="max-height: {MAX_HEIGHT}px; mask-image: linear-gradient(to bottom, black calc(100% - {FADE_HEIGHT}px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black calc(100% - {FADE_HEIGHT}px), transparent 100%);">
			<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
				{#each noteEntries as [verse, note] (verse)}
					<NoteCard {verse} {note} {cardInnerClasses} />
				{/each}
			</div>
		</div>
	{/if}
</div>
