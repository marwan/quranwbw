<script>
	import Notes from '$svgs/Notes.svelte';
	import NoteCard from '$display/NoteCard.svelte';
	import { __userNotes } from '$utils/stores';

	export let cardGridClasses;
	export let cardInnerClasses;

	let openMenuNote = null;

	$: hasNotes = Object.keys($__userNotes).length > 0;
	$: noteEntries = Object.entries($__userNotes);

	function handleMenuToggle(event) {
		openMenuNote = event.detail.verse;
	}

	function handleClickOutside(event) {
		if (openMenuNote && !event.target.closest('.note-menu-container')) {
			openMenuNote = null;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div id="note-cards" class="flex flex-col space-y-4">
	{#if !hasNotes}
		<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
			<span>
				You haven't saved any notes yet! Start jotting down your thoughts by clicking the 
				<Notes classes="inline mt-[-4px]" /> icon. It's like creating your own personal treasure chest of wisdom.
			</span>
		</div>
	{:else}
		<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
			{#each noteEntries as [verse, note] (verse)}
				<NoteCard 
					{verse}
					{note}
					{cardInnerClasses}
					isMenuOpen={openMenuNote === verse}
					on:toggleMenu={handleMenuToggle}
				/>
			{/each}
		</div>
	{/if}
</div>
