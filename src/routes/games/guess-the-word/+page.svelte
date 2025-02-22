<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import party from 'party-js';
	import Check from '$svgs/Check.svelte';
	import Cross from '$svgs/Cross.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { apiEndpoint, errorLoadingDataMessage } from '$data/websiteSettings';
	import { __currentPage, __quizCorrectAnswers, __quizWrongAnswers } from '$utils/stores';
	import { buttonClasses, buttonOutlineClasses, disabledClasses, individualRadioClasses } from '$data/commonClasses';
	import { updateSettings } from '$utils/updateSettings';
	import { playWordAudio } from '$utils/audioController';

	let randomID = 1;
	let fetchData;
	let selection = null;
	let answerChecked = false;
	let isAnswerCorrect = null;
	let randomWord = Math.floor(Math.random() * 3);

	// Fetch random words
	$: fetchData = (async () => {
		try {
			const response = await fetch(`${apiEndpoint}/random-words?randomID=${randomID}`);
			const data = await response.json();
			return data.data;
		} catch (error) {
			console.error(errorLoadingDataMessage, error);
			return [];
		}
	})();

	// Check if the selected answer is correct
	function checkAnswer() {
		answerChecked = true;
		isAnswerCorrect = selection === randomWord;

		if (isAnswerCorrect) {
			// Show confetti for correct answer
			party.confetti(document.body, {
				count: 80,
				spread: 100,
				size: 2
			});

			// Update correct answers count
			updateSettings({ type: 'quizCorrectAnswers', value: $__quizCorrectAnswers + 1 });
		} else {
			// Update wrong answers count
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
		}
	}

	// Set new random word and reset selections
	function setRandomWord() {
		randomID = Math.floor(Math.random() * 9999999) + 1;
		randomWord = Math.floor(Math.random() * 3);
		selection = null;
		isAnswerCorrect = null;
		answerChecked = false;
	}

	// Set the current page
	__currentPage.set('Guess The Word');
</script>

<PageHead title={'Guess The Word'} />

<div class="space-y-12 my-6 md:my-8">
	<div id="word">
		{#await fetchData}
			<Spinner />
		{:then fetchData}
			<div class="flex flex-col space-y-8 justify-center">
				<!-- word -->
				<button class="flex flex-col space-y-4 mx-auto items-center" on:click={() => playWordAudio({ key: fetchData[randomWord].word_key })}>
					<span class="text-5xl md:text-7xl arabic-font-1">{fetchData[randomWord].word_uthmani}</span>
					<span class="text-xs">{fetchData[randomWord].word_transliteration}</span>
				</button>

				<!-- options -->
				<div id="options" class="pt-8">
					<p class="mb-5 text-sm">Guess the correct translation:</p>
					<div class="grid gap-4 md:gap-6 w-full md:grid-cols-2">
						{#each Object.entries(fetchData) as [key, value]}
							<Radio name="bordered" bind:group={selection} value={+key} class={answerChecked === true && selection !== +key ? disabledClasses : null} custom>
								<div class="{individualRadioClasses} {selection === +key ? `${window.theme('border')}` : null}">
									<div class="flex flex-row mr-auto ml-2">{fetchData[key].word_english}</div>

									<!-- check / cross icon -->
									{#if answerChecked === true && selection === +key}
										<div class="justify-end">
											<svelte:component this={selection === randomWord ? Check : Cross} size={5} />
										</div>
									{/if}
								</div>
							</Radio>
						{/each}
					</div>
				</div>

				<!-- answer-results -->
				{#if answerChecked === true && isAnswerCorrect !== null}
					<div id="answer-results" class="flex justify-center text-center font-medium text-md">
						<span>
							{isAnswerCorrect ? 'Your answer was correct 😀' : `Sorry, the correct answer was "${fetchData[randomWord].word_english}" 😟`}
						</span>
					</div>
				{/if}

				<!-- buttons -->
				<div id="buttons" class="flex flex-row space-x-4 justify-center w-full">
					<!-- confirm-button -->
					{#if !answerChecked}
						<div id="confirm-button" class="{selection === null || answerChecked === true ? disabledClasses : null} w-full">
							<button class="{buttonClasses} w-full" on:click={() => checkAnswer()}>Confirm</button>
						</div>
					{/if}

					<!-- skip-word-button -->
					<div id="skip-word-button" class="w-full">
						<button class="{buttonOutlineClasses} w-full" on:click={() => setRandomWord()}>{answerChecked ? 'Next' : 'Skip'} {@html '&#x2192;'}</button>
					</div>
				</div>

				<!-- correct / wrong answers so far -->
				<div id="quiz-stats" class="flex flex-row space-x-4 justify-center text-xs">
					<span>Correct: {$__quizCorrectAnswers}</span>
					<span>|</span>
					<span>Wrong: {$__quizWrongAnswers}</span>
				</div>
			</div>
		{:catch error}
			<p>{errorLoadingDataMessage}</p>
		{/await}
	</div>
</div>
