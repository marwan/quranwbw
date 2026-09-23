<script>
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { createEventDispatcher } from 'svelte';

	export let answerChecked = false;
	export let isAnswerCorrect = null;
	export let isGeneratingWordSet = false;
	export let correctAnswer = '';
	export let isLastWord = false;

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

<div class="min-h-[4.5rem] flex items-center justify-center w-full" aria-live="polite">
	{#if answerChecked === true && isAnswerCorrect !== null}
		{#if isAnswerCorrect}
			<div class="text-center text-sm font-medium">{isLastWord ? 'Correct! Next ayah…' : 'Correct! Next word…'}</div>
		{:else}
			<div id="next-word-button" class="flex flex-col items-center gap-2">
				<p class="text-center text-xs md:text-sm">Correct answer: {correctAnswer}</p>
				{#if isLastWord}
					<p class="text-xs text-theme-text/75">Next ayah…</p>
				{:else}
					<button bind:this={nextButton} class="{buttonOutlineClasses} min-h-11 text-sm md:text-base py-2 md:py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent" disabled={isGeneratingWordSet} on:click={handleNext}>Next word</button>
				{/if}
			</div>
		{/if}
	{:else}
		<div id="buttons" class="flex flex-row space-x-4 justify-center w-full px-2 md:px-0">
			<div id="skip-word-button" class="flex justify-center">
				<button class="{buttonOutlineClasses} min-h-11 text-sm py-2 md:py-2.5" disabled={isGeneratingWordSet} on:click={handleSkip}>Skip word</button>
			</div>
		</div>
	{/if}
</div>
