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
	import { term } from '$utils/terminologies';
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableWordTranslations } from '$data/options';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { describeRange, gameQueryString, isAyahInRange, parseAyahRange, resolveWordTranslation } from './utils/guessTheWordOptions';
	import { fetchQuizData } from './utils/guessTheWordGame';
	import { advanceQuestion, askableIndexes, buildWordQuestion, createAyahSession, isLastAskableWord, recordWordOutcome, skipAyah, upcomingAyah } from './utils/guessTheWordSet';
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
	function slideIn(node, { duration }) {
		return { duration, easing: linear, css: (t, u) => `transform: translateX(${u * 100}%)` };
	}
	function slideOut(node, { duration }) {
		return { duration, easing: linear, css: (t, u) => `transform: translateX(${-u * 100}%)` };
	}

	let selection = null;
	let answerChecked = false;
	let isAnswerCorrect = null;
	let autoProgressTimeout = null;
	let sessionCorrect = 0;
	let sessionWrong = 0;
	let quizData = null;
	let session = null;
	let currentWordSet = [];
	let correctAnswerIndex = 0;
	let previousWordKeys = [];
	let wordSetKey = 0;
	let questionReady = false;
	let isLoading = false;
	let quizError = null;
	let disposed = false;
	let reducedMotion = false;
	let quizControls;
	let moveFocus = false;

	// Game settings. Both live in the URL (?lang=1&from=2:106&to=2:205) so a game can be shared;
	// the language is also remembered for next time.
	// Read once, as the page is created, so they are set before the game starts or the address is rewritten.
	const initialParams = browser ? new URL(window.location.href).searchParams : new URLSearchParams();
	let wordTranslation = resolveWordTranslation(initialParams.get('lang'), $__quizWordTranslation, $__wordTranslation);
	let range = parseAyahRange(initialParams.get('from'), initialParams.get('to'));
	let settingsOpen = false;
	$: languageName = selectableWordTranslations[wordTranslation]?.language || 'English';
	$: translationClasses = selectableWordTranslations[wordTranslation]?.customClasses || '';

	$: currentAyah = session?.deck[session.ayahIndex];
	$: chapterName = currentAyah ? quranMetaData[currentAyah.chapter]?.translation || term('chapter') + ' ' + currentAyah.chapter : '';
	$: chapterTransliteration = currentAyah ? quranMetaData[currentAyah.chapter]?.transliteration || '' : '';
	$: chapterArabic = currentAyah ? quranMetaData[currentAyah.chapter]?.arabic || '' : '';
	$: isLastWord = session && isLastAskableWord(session);

	onMount(() => {
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => (reducedMotion = motionQuery.matches);
		updateMotion();
		motionQuery.addEventListener('change', updateMotion);
		startGame();
		return () => {
			disposed = true;
			clearTimeout(autoProgressTimeout);
			motionQuery.removeEventListener('change', updateMotion);
		};
	});

	// Each start gets an id, so a game started with new settings wins over a load still in flight.
	let loadId = 0;

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
			if (disposed || id !== loadId) return;
			const ayahs = data.ayahs.filter((ayah) => isAyahInRange(ayah, range));
			if (!ayahs.length) throw new Error('None of the ' + term('verse') + 's in ' + describeRange(range) + ' have a ' + languageName + ' meaning for every word. Choose another range or language.');
			quizData = data;
			previousWordKeys = [];
			showQuestion(createAyahSession(ayahs, Math.random, { ordered: Boolean(range) }));
		} catch (error) {
			if (!disposed && id === loadId) showError(error);
		} finally {
			if (!disposed && id === loadId) isLoading = false;
		}
	}

	function syncUrl() {
		replaceState(window.location.pathname + '?' + gameQueryString({ wordTranslation, range }), {});
	}

	// The first sync waits for SvelteKit's router, which is ready once the page has finished navigating.
	afterNavigate(() => syncUrl());

	function applySettings(event) {
		wordTranslation = event.detail.wordTranslation;
		range = event.detail.range;
		updateSettings({ type: 'quizWordTranslation', value: wordTranslation });
		syncUrl();
		clearTimeout(autoProgressTimeout);
		startGame();
	}

	function showError(error) {
		clearTimeout(autoProgressTimeout);
		quizError = error instanceof Error ? error : new Error('Unable to load this ' + term('verse') + '. Please try again.');
		questionReady = false;
	}

	function showQuestion(nextSession) {
		const ayah = nextSession.deck[nextSession.ayahIndex];
		const result = buildWordQuestion(ayah.words[nextSession.wordIndex], quizData.words, [...previousWordKeys, ...ayah.words.map((word) => word.word_key)]);
		questionReady = false;
		selection = null;
		answerChecked = false;
		isAnswerCorrect = null;
		session = nextSession;
		currentWordSet = result.wordSet;
		correctAnswerIndex = result.correctAnswerIndex;
		previousWordKeys = result.previousWordKeys;
		wordSetKey++;
	}

	async function onQuestionReady(event) {
		const panel = event.currentTarget;
		questionReady = true;
		slideOptions = true;
		await tick();
		if (!disposed && moveFocus && panel.isConnected) panel.focus({ preventScroll: true });
	}

	async function checkAnswer(event) {
		if (!questionReady || disposed || !session || session.isComplete || answerChecked) return;
		selection = event.detail;
		if (!Number.isInteger(selection) || selection < 0 || selection >= currentWordSet.length) return;
		answerChecked = true;
		isAnswerCorrect = selection === correctAnswerIndex;
		session = recordWordOutcome(session, isAnswerCorrect ? 'correct' : 'wrong');
		if (isAnswerCorrect) {
			sessionCorrect++;
			updateSettings({ type: 'quizCorrectAnswers', value: $__quizCorrectAnswers + 1 });
			autoProgressTimeout = setTimeout(() => continueWord(), autoAdvanceDelay);
		} else {
			sessionWrong++;
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
			// Wait for the player: the correct answer stays up until they press the Next button.
			await tick();
			if (!disposed) quizControls?.focusNext();
		}
	}

	function continueWord(skip = false) {
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

	function skipCurrentAyah() {
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
		<AyahProgress ayah={currentAyah} {chapterName} {chapterTransliteration} {chapterArabic} wordIndex={session.wordIndex} outcomes={session.outcomes}>
			<!-- The negative margins keep the label's edge in line with the counter below and stop the larger tap
			area from making the title row taller. -->
			<button slot="settings" type="button" aria-label="Game Settings" class="inline-flex p-2 rounded-full items-center border border-transparent hover:border-theme-accent bg-theme-accent/5" on:click={() => (settingsOpen = true)}>
				<Settings size={4} />
			</button>
			<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">Game Settings</Tooltip>
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
					in:slideIn|global={{ duration: reducedMotion || !slideOptions ? 0 : optionsSlideDuration }}
					out:slideOut={{ duration: reducedMotion ? 0 : optionsSlideDuration }}
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
