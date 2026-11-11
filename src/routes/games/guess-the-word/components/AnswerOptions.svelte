<script>
	import Check from '$svgs/Check.svelte';
	import Cross from '$svgs/Cross.svelte';
	import { individualRadioClasses } from '$data/commonClasses';
	import { createEventDispatcher } from 'svelte';

	export let wordSet = [];
	export let selection = null;
	export let answerChecked = false;
	export let isAnswerCorrect = null;
	export let isGeneratingWordSet = false;
	export let correctAnswerIndex = 0;
	// Font and direction of the chosen word-by-word language (e.g. right-to-left for Urdu).
	export let translationClasses = '';
	const dispatch = createEventDispatcher();
	// Right-to-left languages (Urdu, Persian, Sindhi) read from the right edge of the button, with their own size.
	$: rtl = translationClasses.includes('direction-rtl');
</script>

<div id="options" class="px-1 sm:px-3 md:px-4" role="group" aria-label="Answer choices">
	<p class="mb-2 md:mb-5 text-xs md:text-sm">Guess the correct translation:</p>
	<div class="grid gap-2 md:gap-4 lg:gap-6 w-full md:grid-cols-2">
		{#each wordSet as word, index (word.word_key)}
			<button
				type="button"
				dir={rtl ? 'rtl' : undefined}
				disabled={answerChecked || isGeneratingWordSet}
				aria-label={word.word_english + (answerChecked && index === correctAnswerIndex ? ', correct answer' : answerChecked && selection === index ? ', your answer, incorrect' : '')}
				on:click={() => dispatch('answer', index)}
				class="{individualRadioClasses} min-h-14 !p-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent disabled:cursor-default
					{selection === index && !answerChecked ? '!border-theme-accent' : ''}
					{answerChecked && index === correctAnswerIndex ? '!border-theme-accent !bg-theme-accent/10' : ''}
					{answerChecked && selection === index && !isAnswerCorrect ? 'opacity-60' : ''}
					{answerChecked && index !== correctAnswerIndex && (selection !== index || isAnswerCorrect) ? 'opacity-30' : ''}"
			>
				<span class="me-auto ms-2 {rtl ? translationClasses : 'text-sm md:text-base ' + translationClasses}">{word.word_english}</span>
				{#if answerChecked}
					<span class="ms-2 shrink-0" aria-hidden="true">
						{#if index === correctAnswerIndex}
							<Check size={5} />
						{:else if selection === index && !isAnswerCorrect}
							<Cross size={5} />
						{/if}
					</span>
				{/if}
			</button>
		{/each}
	</div>
</div>
