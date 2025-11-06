<script>
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { createEventDispatcher } from 'svelte';

	export let answerChecked = false;
	export let isAnswerCorrect = null;

	const dispatch = createEventDispatcher();

	function handleNext() {
		dispatch('next');
	}

	function handleSkip() {
		dispatch('skip');
	}
</script>

<div class="min-h-[2.5rem] md:min-h-[4rem] flex items-center justify-center mt-1 md:mt-4 w-full">
	{#if answerChecked === true && isAnswerCorrect !== null}
		{#if isAnswerCorrect}
			<div class="text-center font-medium text-xs md:text-md px-2 md:px-4">Your answer was correct 😀</div>
		{:else}
			<!-- Show Next button for incorrect answers -->
			<div id="next-word-button" class="flex justify-center">
				<button class="{buttonOutlineClasses} w-32 text-sm md:text-base py-2 md:py-2.5" on:click={handleNext}>
					Next {@html '&#x2192;'}
				</button>
			</div>
		{/if}
	{:else}
		<div id="buttons" class="flex flex-row space-x-4 justify-center w-full px-2 md:px-0">
			<div id="skip-word-button" class="flex justify-center">
				<button class="{buttonOutlineClasses} w-32 text-sm md:text-base py-2 md:py-2.5" on:click={handleSkip}>Skip {@html '&#x2192;'}</button>
			</div>
		</div>
	{/if}
</div>
