<script>
	import Notes from '$svgs/Notes.svelte';
	import NoteCard from '$display/NoteCard.svelte';
	import ScrollableFadeContainer from '$display/ScrollableFadeContainer.svelte';
	import { __userNotes } from '$utils/stores';

	export let cardGridClasses;
	export let cardInnerClasses;

	let forceCloseDropdowns = 0;

	$: hasNotes = Object.keys($__userNotes).length > 0;
	$: noteEntries = Object.entries($__userNotes);

	function handleScroll() {
		forceCloseDropdowns += 1;
	}
</script>

<ScrollableFadeContainer containerId="note-cards" onScrollAction={handleScroll}>
	{#if !hasNotes}
		<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
			<span class="leading-relaxed">
				You haven't saved any notes yet! Start jotting down your thoughts by clicking the
				<Notes classes="inline mt-[-4px] mx-1" /> icon. It's like creating your own personal treasure chest of wisdom.
			</span>
		</div>
	{:else}
		<div>
			<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
				{#each noteEntries as [verse, note] (verse)}
					<NoteCard {verse} {note} {cardInnerClasses} forceClose={forceCloseDropdowns} />
				{/each}
			</div>
		</div>
	{/if}
</ScrollableFadeContainer>
