<script>
	import { onMount } from 'svelte';
	import Notes from '$svgs/Notes.svelte';
	import NoteCard from '$display/NoteCard.svelte';
	import { __userNotes } from '$utils/stores';

	export let cardGridClasses;
	export let cardInnerClasses;

	const MAX_HEIGHT = 250;
	const FADE_HEIGHT = 50;

	let noteContainer;
	let fadePixels = FADE_HEIGHT;
	let forceCloseDropdowns = 0;

	$: hasNotes = Object.keys($__userNotes).length > 0;
	$: noteEntries = Object.entries($__userNotes);

	onMount(() => {
		if (!noteContainer) return;

		const resizeObserver = new ResizeObserver(() => {
			updateFade();
		});

		resizeObserver.observe(noteContainer);
		updateFade();

		return () => {
			resizeObserver.disconnect();
		};
	});

	function updateFade({ closeDropdowns = false } = {}) {
		if (!noteContainer) return;
		
		const { scrollTop, scrollHeight, clientHeight } = noteContainer;
		const maxScroll = scrollHeight - clientHeight;
		
		if (maxScroll <= 0) {
			// No scrollable overflow: no fade needed
			fadePixels = 0;
			return;
		}
		
		// Calculate how close we are to the bottom (0 = top, 1 = bottom)
		const scrollProgress = scrollTop / maxScroll;
		
		// Fade should be full (FADE_HEIGHT) at top and go to 0 at bottom
		fadePixels = Math.max(0, Math.min(FADE_HEIGHT, FADE_HEIGHT * (1 - scrollProgress)));

		if (closeDropdowns) {
			forceCloseDropdowns += 1;
		}
	}

	function handleScroll() {
		updateFade({ closeDropdowns: true });
	}
</script>

<div class="relative">
	<div 
		id="note-cards" 
		bind:this={noteContainer} 
		on:scroll={handleScroll}
		class="flex flex-col space-y-4 overflow-y-scroll no-scrollbar-scroll-container"
		style="max-height: {MAX_HEIGHT}px; mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%);"
	>
		{#if !hasNotes}
			<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
				<span>
					You haven't saved any notes yet! Start jotting down your thoughts by clicking the
					<Notes classes="inline mt-[-4px]" /> icon. It's like creating your own personal treasure chest of wisdom.
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
	</div>
</div>
