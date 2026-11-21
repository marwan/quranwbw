<script>
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { createEventDispatcher } from 'svelte';

	export let answerChecked = false;
	export let isAnswerCorrect = null;
	export let isGeneratingWordSet = false;
	export let correctAnswer = '';
	export let isLastWord = false;
	// Font and direction of the chosen word-by-word language (e.g. right-to-left for Urdu).
	export let translationClasses = '';

	const dispatch = createEventDispatcher();
	let nextButton;
	export function focusNext() {
		nextButton?.focus({ preventScroll: true });
	}

	function handleNext() {
		dispatch('next');
	}

	function handleSkip() {
		dispatch('skip');
	}
</script>

<!-- Fixed height, so swapping the buttons for the correct answer never moves the score below.
The correct answer stays on one line: it is also marked among the options above. -->
<div class="h-[4.5rem] flex items-center justify-center w-full" aria-live="polite">
	{#if answerChecked === true && isAnswerCorrect !== null}
		{#if isAnswerCorrect}
			<div class="text-center text-sm font-medium">{isLastWord ? 'Correct! Next ayah…' : 'Correct! Next word…'}</div>
		{:else}
			<div id="next-word-button" class="flex max-w-full flex-col items-center gap-2 px-2 md:px-0">
				<p class="max-w-full truncate text-center text-xs leading-5 md:text-sm" title={correctAnswer}>Correct answer: <span class={translationClasses}>{correctAnswer}</span></p>
				<button bind:this={nextButton} class="{buttonOutlineClasses} min-h-11 text-sm py-2 md:py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent" disabled={isGeneratingWordSet} on:click={handleNext}>{isLastWord ? 'Next ayah' : 'Next word'}</button>
			</div>
		{/if}
	{:else}
		<div id="buttons" class="flex flex-row gap-3 justify-center w-full px-2 md:px-0">
			<button class="{buttonOutlineClasses} min-h-11 text-sm py-2 md:py-2.5" disabled={isGeneratingWordSet} on:click={handleSkip}>Skip word</button>
			<!-- On the last word, skipping the word already moves to the next ayah. -->
			{#if !isLastWord}
				<button class="{buttonOutlineClasses} min-h-11 text-sm py-2 md:py-2.5" disabled={isGeneratingWordSet} on:click={() => dispatch('skipAyah')}>Skip ayah</button>
			{/if}
		</div>
	{/if}
</div>
