<script>
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';
	import { createEventDispatcher } from 'svelte';

	export let answerChecked = false;
	export let isAnswerCorrect = null;
	export let isGeneratingWordSet = false;
	export let correctAnswer = '';
	export let isLastWord = false;
	export let canSkipAyah = true;
	// Font and direction of the chosen word-by-word language (e.g. right-to-left for Urdu).
	export let translationClasses = '';

	const dispatch = createEventDispatcher();

	// One set of classes for all three buttons, so they always look the same
	const controlButtonClasses = `${buttonOutlineClasses} min-h-11 text-sm py-2 md:py-2.5`;

	// The Next button, so the page can move keyboard focus to it after a wrong answer
	let nextButton;
	export function focusNext() {
		nextButton?.focus({ preventScroll: true });
	}
</script>

<!-- Fixed height, so swapping the buttons for the correct answer never moves the score below.
The correct answer stays on one line: it is also marked among the options above. -->
<div class="h-[4.5rem] flex items-center justify-center w-full" aria-live="polite">
	{#if answerChecked}
		{#if isAnswerCorrect}
			<div class="text-center text-sm">Correct! Moving on to the next {isLastWord ? term('verse') : 'word'}…</div>
		{:else}
			<div class="flex max-w-full flex-col items-center space-y-4 px-2 md:px-0">
				<p class="max-w-full truncate text-center text-sm" title={correctAnswer}>Correct answer: <span class={translationClasses}>{correctAnswer}</span></p>
				<button bind:this={nextButton} class={controlButtonClasses} disabled={isGeneratingWordSet} on:click={() => dispatch('next')}>Next {isLastWord ? term('verse') : 'Word'}</button>
			</div>
		{/if}
	{:else}
		<div class="flex flex-row gap-3 justify-center w-full px-2 md:px-0">
			<button class={controlButtonClasses} disabled={isGeneratingWordSet} on:click={() => dispatch('skip')}>Skip Word</button>
			<!-- On the last word, skipping the word already moves to the next verse. -->
			{#if !isLastWord && canSkipAyah}
				<button class={controlButtonClasses} disabled={isGeneratingWordSet} on:click={() => dispatch('skipAyah')}>Skip {term('verse')}</button>
			{/if}
		</div>
	{/if}
</div>
