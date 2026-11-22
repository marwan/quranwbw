<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import AnswerOptions from './components/AnswerOptions.svelte';
	import QuizControls from './components/QuizControls.svelte';
	import QuizStats from './components/QuizStats.svelte';
	import AyahProgress from './components/AyahProgress.svelte';
	import AyahWordStrip from './components/AyahWordStrip.svelte';
	import GuessTheWordSettingsModal from './components/GuessTheWordSettingsModal.svelte';
	import Settings from '$svgs/Settings.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { __currentPage, __quizCorrectAnswers, __quizWrongAnswers, __quizWordTranslation, __wordTranslation } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { fetchWordData } from '$utils/fetchData';
	import { term } from '$utils/terminologies';
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableWordTranslations } from '$data/options';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { describeRange, gameQueryString, isAyahInRange, parseAyahRange, resolveWordTranslation } from './utils/guessTheWordOptions';
	import { advanceQuestion, askableIndexes, buildQuizData, buildWordQuestion, createAyahSession, isLastAskableWord, recordWordOutcome, shuffleArray, skipAyah, upcomingAyah } from './utils/guessTheWordSet';
	import { reducedMotion } from './utils/reducedMotion';
	import { linear } from 'svelte/easing';
	import { onMount, tick } from 'svelte';

	// After a correct answer the options stay still this long, so the player sees it marked, before moving on
	// (wrong answers wait for the player).
	const autoAdvanceDelay = 400;

	// The answer options move like a carousel: the new set comes in from past the right edge while the old set
	// leaves past the left edge, both fully opaque and side by side (same length and easing). Measured in the
	// panel's own width, so it covers the whole width on every screen.
	const optionsSlideDuration = 250;
	// The first options are already in place when the page opens; only later sets slide in.
	let slideOptions = false;

	// Svelte transition: the new answer options enter from the right (100% -> 0%).
	// `u` goes from 1 to 0 while the animation plays, so the panel starts fully to the right and ends in place.
	function slideIn(node, { duration }) {
		return { duration, easing: linear, css: (t, u) => `transform: translateX(${u * 100}%)` };
	}
	// Svelte transition: the old answer options leave to the left (0% -> -100%).
	function slideOut(node, { duration }) {
		return { duration, easing: linear, css: (t, u) => `transform: translateX(${-u * 100}%)` };
	}

	// Current question state
	let selection = null; // index of the option the player picked (null = nothing picked yet)
	let answerChecked = false; // true once the player has answered the current word
	let isAnswerCorrect = null; // null until answered, then true or false
	let autoProgressTimeout = null; // timer that moves on automatically after a correct answer
	let sessionCorrect = 0; // correct answers since the page was opened
	let sessionWrong = 0; // wrong answers since the page was opened
	let quizData = null; // all ayahs and words fetched for the chosen language
	let session = null; // the running game: which ayah, which word, results so far
	let currentWordSet = []; // the 4 options shown for the current word
	let correctAnswerIndex = 0; // position of the right answer inside currentWordSet
	let previousWordKeys = []; // words used in the last question, so the next options feel fresh
	let wordSetKey = 0; // changes with every question, which makes Svelte play the slide animation
	let questionReady = false; // false while options are sliding in or the game is loading (input locked)
	let isLoading = false;
	let quizError = null;
	let disposed = false; // true once the page is closed, so late async work stops
	let quizControls; // reference to the QuizControls component, used to focus its Next button
	let moveFocus = false; // keyboard focus moves to the new options only after the player has started playing

	// Game settings. Both live in the URL (?lang=1&from=2:106&to=2:205) so a game can be shared;
	// the language is also remembered for next time.
	// Read once, as the page is created, so they are set before the game starts or the address is rewritten.
	const initialParams = browser ? new URL(window.location.href).searchParams : new URLSearchParams();
	let wordTranslation = resolveWordTranslation(initialParams.get('lang'), $__quizWordTranslation, $__wordTranslation);
	let range = parseAyahRange(initialParams.get('from'), initialParams.get('to'));
	let settingsOpen = false;
	$: languageName = selectableWordTranslations[wordTranslation]?.language || 'English';
	$: translationClasses = selectableWordTranslations[wordTranslation]?.customClasses || '';

	// Values worked out from the session, re-calculated whenever the session changes
	$: currentAyah = session?.deck[session.ayahIndex];
	$: chapterTransliteration = currentAyah ? quranMetaData[currentAyah.chapter]?.transliteration || '' : '';
	$: isLastWord = session && isLastAskableWord(session);

	// Starts the game when the page opens, and cleans up when the page closes
	onMount(() => {
		startGame();
		return () => {
			disposed = true;
			clearTimeout(autoProgressTimeout);
		};
	});

	// Fetches every word of the Quran in the chosen translation language and turns it into quiz data
	// (ayahs + a flat list of words). Only the word list is shuffled, because wrong options are picked by
	// walking through it in order; the ayahs keep their order.
	async function fetchQuizData(translation) {
		const data = buildQuizData(await fetchWordData(1, translation, 1));
		return { ...data, words: shuffleArray(data.words) };
	}

	// Each start gets an id, so a game started with new settings wins over a load still in flight.
	let loadId = 0;

	// Loads the data and starts a fresh game with the current language and range.
	// Used on the first load, after changing settings, and by the "Try Again" button.
	async function startGame() {
		if (disposed) return;
		const id = ++loadId;
		isLoading = true;
		quizError = null;
		// A restart keeps the current game on screen (locked) until the new one is ready. Tearing the game down
		// to the spinner and straight back up while its exit animation was still running left the page blank.
		questionReady = false;
		clearTimeout(autoProgressTimeout);
		try {
			const data = await fetchQuizData(wordTranslation);
			// Stop if the page was closed, or if a newer startGame call has taken over while we were loading
			if (disposed || id !== loadId) return;
			// Keep only the ayahs inside the chosen range (all of them when there is no range)
			const ayahs = data.ayahs.filter((ayah) => isAyahInRange(ayah, range));
			if (!ayahs.length) throw new Error('None of the ' + term('verse') + 's in ' + describeRange(range) + ' have a ' + languageName + ' meaning for every word. Choose another range or language.');
			quizData = data;
			previousWordKeys = [];
			// A range is played in order; the whole Quran is played in random order
			showQuestion(createAyahSession(ayahs, Math.random, { ordered: Boolean(range) }));
		} catch (error) {
			if (!disposed && id === loadId) showError(error);
		} finally {
			if (!disposed && id === loadId) isLoading = false;
		}
	}

	// Writes the current language and range into the address bar, so the link can be shared.
	// replaceState changes the URL without adding a new browser history entry.
	function syncUrl() {
		replaceState(window.location.pathname + '?' + gameQueryString({ wordTranslation, range }), {});
	}

	// The first sync waits for SvelteKit's router, which is ready once the page has finished navigating.
	afterNavigate(() => syncUrl());

	// Runs when the player presses Start in the settings modal: saves the new settings and restarts the game.
	function applySettings(event) {
		wordTranslation = event.detail.wordTranslation;
		range = event.detail.range;
		// Remember the chosen language for next time (the range is only kept in the URL)
		updateSettings({ type: 'quizWordTranslation', value: wordTranslation });
		syncUrl();
		clearTimeout(autoProgressTimeout);
		startGame();
	}

	// Shows the error screen, using a generic message if the error is not a normal Error object
	function showError(error) {
		clearTimeout(autoProgressTimeout);
		quizError = error instanceof Error ? error : new Error('Unable to load this ' + term('verse') + '. Please try again.');
		questionReady = false;
	}

	// Puts a session on screen: builds the 4 options for its current word and resets the answer state.
	// Used for the very first question and for every question after it.
	function showQuestion(nextSession) {
		const ayah = nextSession.deck[nextSession.ayahIndex];
		// Wrong options avoid the previous question's words and all words of this ayah (they are on screen already)
		const result = buildWordQuestion(ayah.words[nextSession.wordIndex], quizData.words, [...previousWordKeys, ...ayah.words.map((word) => word.word_key)]);
		// Lock input until the new options have finished sliding in
		questionReady = false;
		selection = null;
		answerChecked = false;
		isAnswerCorrect = null;
		session = nextSession;
		currentWordSet = result.wordSet;
		correctAnswerIndex = result.correctAnswerIndex;
		previousWordKeys = result.previousWordKeys;
		// A new key makes Svelte swap the options panel, which plays the slide out/in animation
		wordSetKey++;
	}

	// Runs when the new options have finished sliding in: unlocks input and, once the player has started
	// playing, moves keyboard focus to the new options (so keyboard users do not lose their place).
	async function onQuestionReady(event) {
		const panel = event.currentTarget;
		questionReady = true;
		slideOptions = true;
		await tick();
		if (!disposed && moveFocus && panel.isConnected) panel.focus({ preventScroll: true });
	}

	// Runs when the player picks an option: checks it, records the result and updates the scores.
	async function checkAnswer(event) {
		// Ignore taps while locked, after the page closed, or if this word was already answered
		if (!questionReady || disposed || !session || session.isComplete || answerChecked) return;
		selection = event.detail;
		// Ignore anything that is not a valid option index
		if (!Number.isInteger(selection) || selection < 0 || selection >= currentWordSet.length) return;
		answerChecked = true;
		isAnswerCorrect = selection === correctAnswerIndex;
		session = recordWordOutcome(session, isAnswerCorrect ? 'correct' : 'wrong');
		if (isAnswerCorrect) {
			sessionCorrect++;
			updateSettings({ type: 'quizCorrectAnswers', value: $__quizCorrectAnswers + 1 });
			// Correct: move on by itself after a short pause
			autoProgressTimeout = setTimeout(() => continueWord(), autoAdvanceDelay);
		} else {
			sessionWrong++;
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
			// Wait for the player: the correct answer stays up until they press the Next button.
			await tick();
			if (!disposed) quizControls?.focusNext();
		}
	}

	// Moves to the next word (or the first word of the next ayah after the last word).
	// - continueWord()      : after an answer, called by the timer (correct) or the Next button (wrong)
	// - continueWord(true)  : the Skip Word button, which counts the word as skipped
	function continueWord(skip = false) {
		// Skip only works before answering, Next only works after answering
		if (!questionReady || disposed || !session || session.isComplete || (skip ? answerChecked : !answerChecked)) return;
		clearTimeout(autoProgressTimeout);
		moveFocus = true;
		if (skip) session = recordWordOutcome(session, 'skipped');
		try {
			showQuestion(advanceQuestion(session));
		} catch (error) {
			showError(error);
		}
	}

	// The Skip Ayah button: leaves the current ayah and starts the next one (its remaining words are not counted)
	function skipCurrentAyah() {
		// Only allowed before answering the current word
		if (!questionReady || disposed || !session || session.isComplete || answerChecked) return;
		clearTimeout(autoProgressTimeout);
		moveFocus = true;
		try {
			showQuestion(skipAyah(session));
		} catch (error) {
			showError(error);
		}
	}

	__currentPage.set('Guess The Word');
</script>

<PageHead title="Guess The Word" description="Learn Quranic vocabulary by following each {term('verse')}, one word at a time." />

<!-- No top padding of our own: the site layout already clears the fixed navbar. -->
<div class="mx-auto w-full max-w-3xl pb-5 md:pb-8">
	{#if quizError}
		<ErrorLoadingData error={quizError} center={false} />
		<div class="mt-5 flex flex-wrap justify-center gap-3">
			<button class={buttonOutlineClasses} disabled={isLoading} on:click={startGame}>Try Again</button>
			<!-- Settings stay reachable when a chosen range or language cannot be played. -->
			<button class="{buttonOutlineClasses} inline-flex items-center gap-2" aria-haspopup="dialog" on:click={() => (settingsOpen = true)}><Settings size={4} /> Game Settings</button>
		</div>
	{:else if !session}
		<div class="py-16" role="status" aria-label="Loading {term('verse')}s"><Spinner /></div>
	{:else}
		<AyahProgress ayah={currentAyah} {chapterTransliteration} wordIndex={session.wordIndex} outcomes={session.outcomes}>
			<svelte:fragment slot="settings">
				<button type="button" aria-label="Game Settings" class="inline-flex p-2 rounded-full items-center border border-transparent hover:border-theme-accent bg-theme-accent/5" on:click={() => (settingsOpen = true)}>
					<Settings size={4} />
				</button>
				<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">Game Settings</Tooltip>
			</svelte:fragment>
		</AyahProgress>
		<div class="mt-8 md:mt-12">
			<AyahWordStrip ayah={currentAyah} nextAyah={upcomingAyah(session)} wordIndex={session.wordIndex} />
		</div>
		<!-- Outside the sliding panel, so only the options move. -->
		<p class="px-1 pt-6 text-sm sm:px-3 md:px-4 md:pt-6">Guess the correct translation:</p>
		<div class="grid overflow-hidden" inert={!questionReady}>
			{#key wordSetKey}
				<div
					class="col-start-1 row-start-1 min-w-0 outline-none py-4 md:py-6"
					tabindex="-1"
					role="group"
					aria-label={'Word ' + (askableIndexes(currentAyah).indexOf(session.wordIndex) + 1) + ' of ' + askableIndexes(currentAyah).length}
					in:slideIn|global={{ duration: $reducedMotion || !slideOptions ? 0 : optionsSlideDuration }}
					out:slideOut={{ duration: $reducedMotion ? 0 : optionsSlideDuration }}
					on:introend={onQuestionReady}
				>
					<AnswerOptions wordSet={currentWordSet} {selection} on:answer={checkAnswer} {answerChecked} {isAnswerCorrect} isGeneratingWordSet={!questionReady} {correctAnswerIndex} {translationClasses} />
				</div>
			{/key}
		</div>
		<QuizControls bind:this={quizControls} {answerChecked} {isAnswerCorrect} {isLastWord} isGeneratingWordSet={!questionReady} correctAnswer={currentWordSet[correctAnswerIndex].word_english} {translationClasses} on:next={() => continueWord()} on:skip={() => continueWord(true)} on:skipAyah={skipCurrentAyah} />
		<QuizStats {sessionCorrect} {sessionWrong} allTimeCorrect={$__quizCorrectAnswers} allTimeWrong={$__quizWrongAnswers} />
	{/if}
</div>

<GuessTheWordSettingsModal bind:open={settingsOpen} {wordTranslation} {range} currentChapter={currentAyah?.chapter ?? 1} on:apply={applySettings} />
