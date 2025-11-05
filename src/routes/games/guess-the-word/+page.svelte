<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import party from 'party-js';
	import Check from '$svgs/Check.svelte';
	import Cross from '$svgs/Cross.svelte';
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __currentPage, __quizCorrectAnswers, __quizWrongAnswers } from '$utils/stores';
	import { buttonOutlineClasses, disabledClasses, individualRadioClasses } from '$data/commonClasses';
	import { updateSettings } from '$utils/updateSettings';
	import { playWordAudio } from '$utils/audioController';
	import { fetchWordData } from '$utils/fetchData';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let selection = null;
	let answerChecked = false;
	let isAnswerCorrect = null;
	let randomWord = 0;
	let autoProgressTimeout = null;
	let sessionCorrect = 0;
	let sessionWrong = 0;
	let sessionTotal = 0;
	let currentWordSet = [];
	let allFetchedWords = []; // Store the 5 words we fetched
	let currentWordIndex = 0;
	let wordSetKey = 0;

	// Load initial words
	let randomWordsData = fetchRandomWords();

	$: sessionAccuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

	// Automatically check answer when selection is made
	$: if (selection !== null && !answerChecked) {
		checkAnswer();
	}

	// Fetches all word data and returns 4 random words with their Arabic, transliteration, and translation
	async function fetchRandomWords() {
		const { arabicWordData, translationWordData, transliterationWordData } = await fetchWordData(1, 1, 1);

		const allWordEntries = [];

		for (const chapter in arabicWordData) {
			const verses = arabicWordData[chapter];
			for (const verse in verses) {
				const [arabicWords = []] = verses[verse];
				const translations = translationWordData[chapter]?.[verse]?.[0] || [];
				const transliterations = transliterationWordData[chapter]?.[verse]?.[0] || [];

				for (let i = 0; i < arabicWords.length; i++) {
					allWordEntries.push({
						word_key: `${chapter}:${verse}:${i + 1}`,
						word_arabic: arabicWords[i],
						word_transliteration: transliterations[i] || '',
						word_english: translations[i] || ''
					});
				}
			}
		}

		// Shuffle and pick 5 random unique words for efficiency
		const shuffled = allWordEntries.sort(() => 0.5 - Math.random());
		const selected = shuffled.slice(0, 5);

		return selected;
	}

	// Check if the selected answer is correct
	function checkAnswer() {
		answerChecked = true;
		isAnswerCorrect = selection === randomWord;
		sessionTotal++;

		if (isAnswerCorrect) {
			sessionCorrect++;
			// Show confetti for correct answer
			party.confetti(document.body, {
				count: 80,
				spread: 100,
				size: 2
			});

			// Update correct answers count
			updateSettings({ type: 'quizCorrectAnswers', value: $__quizCorrectAnswers + 1 });
		} else {
			sessionWrong++;
			// Update wrong answers count
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
		}

		// Auto-progress only for correct answers; for wrong answers, require Next click
		clearTimeout(autoProgressTimeout);
		if (isAnswerCorrect) {
			autoProgressTimeout = setTimeout(() => {
				setRandomWord();
			}, 600);
		}
	}

	// Set new random word and reset selections
	async function setRandomWord() {
		clearTimeout(autoProgressTimeout);
		
		// Move to next word, fetch new batch if we've used all 5
		currentWordIndex++;
		if (currentWordIndex >= allFetchedWords.length) {
			allFetchedWords = await fetchRandomWords();
			currentWordIndex = 0;
		}
		
		// Pick 4 random words from our pool for options, ensuring one is the correct answer
		const correctWord = allFetchedWords[currentWordIndex];
		const otherWords = allFetchedWords.filter((_, idx) => idx !== currentWordIndex);
		const shuffledOthers = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
		
		// Combine and shuffle
		currentWordSet = [correctWord, ...shuffledOthers].sort(() => 0.5 - Math.random());
		randomWord = currentWordSet.findIndex(word => word.word_key === correctWord.word_key);
		
		wordSetKey++; // Trigger transition
		
		selection = null;
		isAnswerCorrect = null;
		answerChecked = false;
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
				const correctWord = allFetchedWords[0];
				const otherWords = allFetchedWords.slice(1, 4);
				currentWordSet = [correctWord, ...otherWords].sort(() => 0.5 - Math.random());
				randomWord = currentWordSet.findIndex(word => word.word_key === correctWord.word_key);
			})()}
		{/if}
		
		{#if currentWordSet.length > 0}
			<div class="flex flex-col my-2 md:my-6 lg:my-8 justify-center">
				<div class="relative overflow-visible min-h-[24rem] sm:min-h-[26rem] md:min-h-[28rem]">
					{#key wordSetKey}
						<div
							class="absolute inset-0 overflow-visible flex flex-col"
							in:fly={{ x: 280, duration: 500, easing: quintOut }}
							out:fly={{ x: -280, duration: 320, easing: quintOut }}
						>
							<!-- word -->
							<button
								class="flex flex-col space-y-1 sm:space-y-2 md:space-y-4 mx-auto items-center mb-3 md:mb-8 pt-1 md:pt-4"
								on:click={() => playWordAudio({ key: currentWordSet[randomWord].word_key })}
							>
								<span class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl arabic-font-1">{currentWordSet[randomWord].word_arabic}</span>
								<span class="text-sm md:text-base">{currentWordSet[randomWord].word_transliteration}</span>
							</button>

							<!-- options -->
							<div id="options" class="pt-2 md:pt-8">
								<p class="mb-2 md:mb-5 text-xs md:text-sm">Guess the correct translation:</p>
								<div class="grid gap-2 md:gap-4 lg:gap-6 w-full md:grid-cols-2">
									{#each Object.entries(currentWordSet) as [key, _]}
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
													{answerChecked && isAnswerCorrect && selection === +key ? ' !border-green-500 ring-2 !ring-green-500' : ''}
													{answerChecked && !isAnswerCorrect && selection === +key ? ' !border-red-500 ring-2 !ring-red-500' : ''}
													{answerChecked && !isAnswerCorrect && +key === randomWord ? ' !border-green-500 ring-2 !ring-green-500' : ''}"
											>
												<div class="flex flex-row mr-auto ml-2 text-sm md:text-base">{currentWordSet[key].word_english}</div>

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
						</div>
					{/key}
				</div>
			</div>
			
						<!-- answer-results / skip-word-button with consistent height -->
						<div class="min-h-[2.5rem] md:min-h-[4rem] flex items-center justify-center mt-1 md:mt-4 w-full">
							{#if answerChecked === true && isAnswerCorrect !== null}
								{#if isAnswerCorrect}
									<div class="text-center font-medium text-xs md:text-md px-2 md:px-4">Your answer was correct 😀</div>
								{:else}
									<!-- Show Next button for incorrect answers -->
									<div id="skip-word-button" class="w-full">
										<button class="{buttonOutlineClasses} w-full text-sm md:text-base py-2 md:py-2.5" on:click={() => setRandomWord()}>
											Next {@html '&#x2192;'}
										</button>
									</div>
								{/if}
							{:else}
								<div id="buttons" class="flex flex-row space-x-4 justify-center w-full px-2 md:px-0">
									<div id="skip-word-button" class="w-full">
										<button class="{buttonOutlineClasses} w-full text-sm md:text-base py-2 md:py-2.5" on:click={() => setRandomWord()}>Skip {@html '&#x2192;'}</button>
									</div>
								</div>
							{/if}
						</div>

				<!-- correct / wrong answers so far -->
				<div id="quiz-stats" class="flex flex-col space-y-2 md:space-y-3 items-center mt-2 md:mt-6">
				<!-- Session Score -->
				<div class="flex flex-col items-center space-y-1 p-2 md:p-4 rounded-lg border-2 {window.theme('borderSecondary')}">
					<span class="text-xs md:text-sm font-semibold">Current Score</span>
					<div class="flex flex-row space-x-2 md:space-x-4 text-sm md:text-md">
						<span class="text-green-600 dark:text-green-400">✓ {sessionCorrect}</span>
						<span>|</span>
						<span class="text-red-600 dark:text-red-400">✗ {sessionWrong}</span>
					</div>
				</div>
				<!-- All-Time Score -->
				<div class="flex flex-row space-x-4 text-xs opacity-70">
					<span>All-Time: Correct {$__quizCorrectAnswers} | Wrong {$__quizWrongAnswers}</span>
				</div>
			</div>
		{/if}
	{:catch error}
		<ErrorLoadingData {error} />
	{/await}
</div>
