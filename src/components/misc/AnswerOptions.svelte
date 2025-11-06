<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import Cross from '$svgs/Cross.svelte';
	import { individualRadioClasses } from '$data/commonClasses';

	export let wordSet = [];
	export let selection = null;
	export let answerChecked = false;
	export let isAnswerCorrect = null;
	export let correctAnswerIndex = 0;
</script>

<div id="options" class="pt-2 md:pt-8 px-2 sm:px-3 md:px-4">
	<p class="mb-2 md:mb-5 text-xs md:text-sm">Guess the correct translation:</p>
	<div class="grid gap-2 md:gap-4 lg:gap-6 w-full md:grid-cols-2">
		{#each Object.entries(wordSet) as [key, word]}
			<Radio
				name="bordered"
				bind:group={selection}
				value={+key}
				disabled={answerChecked}
				class={answerChecked ? 'pointer-events-none cursor-not-allowed select-none' : null}
				custom
			>
				<div
					class="{individualRadioClasses}
						{selection === +key ? `${window.theme('border')}` : null}
						{answerChecked && isAnswerCorrect && selection === +key ? ' !border-green-500 border-2' : ''}
						{answerChecked && !isAnswerCorrect && selection === +key ? ' !border-red-500 border-2' : ''}
						{answerChecked && !isAnswerCorrect && +key === correctAnswerIndex ? ' !border-green-500 border-2' : ''}"
				>
					<div class="flex flex-row mr-auto ml-2 text-sm md:text-base">{word.word_english}</div>

					<!-- check / cross icon -->
					{#if answerChecked === true && selection === +key}
						<div class="justify-end">
							<svelte:component this={selection === correctAnswerIndex ? Check : Cross} size={5} />
						</div>
					{/if}
				</div>
			</Radio>
		{/each}
	</div>
</div>
