<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import WordDisplay from '$misc/WordDisplay.svelte';
	import AnswerOptions from '$misc/AnswerOptions.svelte';
	import QuizControls from '$misc/QuizControls.svelte';
	import QuizStats from '$misc/QuizStats.svelte';
	import party from 'party-js';
	import { __currentPage, __quizCorrectAnswers, __quizWrongAnswers } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { fetchRandomWords, generateNextWordSet } from '$utils/guessTheWordGame';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	// Quiz state
	let selection = null;
	let answerChecked = false;
	let isAnswerCorrect = null;
	let autoProgressTimeout = null;
	
	// Session tracking
	let sessionCorrect = 0;
	let sessionWrong = 0;
	
	// Word management
	let currentWordSet = [];
	let correctAnswerIndex = 0;
	let allFetchedWords = [];
	let currentWordIndex = -1;
	let previousWordKeys = [];
	let wordSetKey = 0;
	let isGeneratingWordSet = false;
	let needsInitialWordSet = false;

	// Load initial words
	let randomWordsData = fetchRandomWords();

	// Reactive statements
	$: if (needsInitialWordSet && allFetchedWords.length > 0 && !isGeneratingWordSet) {
		needsInitialWordSet = false;
		loadNextWord();
	}

	$: if (selection !== null && !answerChecked) {
		checkAnswer();
	}

	/**
	 * Check if the selected answer is correct
	 */
	function checkAnswer() {
		answerChecked = true;
		isAnswerCorrect = selection === correctAnswerIndex;

		if (isAnswerCorrect) {
			sessionCorrect++;
			updateSettings({ type: 'quizCorrectAnswers', value: $__quizCorrectAnswers + 1 });
			
			// Show confetti for correct answer
			party.confetti(document.body, {
				count: 80,
				spread: 100,
				size: 2
			});

			// Auto-progress for correct answers
			clearTimeout(autoProgressTimeout);
			autoProgressTimeout = setTimeout(() => {
				loadNextWord();
			}, 600);
		} else {
			sessionWrong++;
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
		}
	}

	/**
	 * Load the next word set
	 */
	async function loadNextWord() {
		if (isGeneratingWordSet) {
			return;
		}

		isGeneratingWordSet = true;

		// Reset state
		selection = null;
		answerChecked = false;
		isAnswerCorrect = null;
		clearTimeout(autoProgressTimeout);

		try {
			const result = await generateNextWordSet(allFetchedWords, currentWordIndex, previousWordKeys);
			
			currentWordSet = result.wordSet;
			correctAnswerIndex = result.correctAnswerIndex;
			allFetchedWords = result.allFetchedWords;
			currentWordIndex = result.currentWordIndex;
			previousWordKeys = result.previousWordKeys;
			
			wordSetKey++; // Trigger transition
		} finally {
			isGeneratingWordSet = false;
		}
	}

	__currentPage.set('Guess The Word');
</script>

<PageHead title={'Guess The Word'} />

<div class="space-y-6 md:space-y-12 max-w-3xl mx-auto w-full px-3 sm:px-0">
	{#await randomWordsData}
		<Spinner />
	{:then initialData}
		{#if allFetchedWords.length === 0}
			{(() => {
				allFetchedWords = initialData;
				needsInitialWordSet = true;
			})()}
		{/if}
		
		{#if currentWordSet.length > 0}
			<div class="flex flex-col my-2 md:my-6 lg:my-8 justify-center">
				<div class="relative overflow-hidden min-h-[28rem] sm:min-h-[30rem] md:min-h-[30rem] py-4">
					{#key wordSetKey}
						<div
							class="absolute inset-0 flex flex-col py-4"
							in:fly={{ x: 280, duration: 300, easing: quintOut }}
							out:fly={{ x: -280, duration: 200, easing: quintOut }}
						>
							<WordDisplay 
								word={currentWordSet[correctAnswerIndex]} 
								wordKey={currentWordSet[correctAnswerIndex].word_key}
							/>

							<AnswerOptions 
								wordSet={currentWordSet}
								bind:selection
								{answerChecked}
								{isAnswerCorrect}
								{correctAnswerIndex}
							/>
						</div>
					{/key}
				</div>
			</div>
			
			<QuizControls 
				{answerChecked}
				{isAnswerCorrect}
				on:next={loadNextWord}
				on:skip={loadNextWord}
			/>

			<QuizStats 
				{sessionCorrect}
				{sessionWrong}
				allTimeCorrect={$__quizCorrectAnswers}
				allTimeWrong={$__quizWrongAnswers}
			/>
		{/if}
	{:catch error}
		<ErrorLoadingData {error} />
	{/await}
</div>
