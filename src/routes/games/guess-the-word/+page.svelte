<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import WordDisplay from '$misc/WordDisplay.svelte';
	import AnswerOptions from '$misc/AnswerOptions.svelte';
	import QuizControls from '$misc/QuizControls.svelte';
	import QuizStats from '$misc/QuizStats.svelte';
	import AyahProgress from '$misc/AyahProgress.svelte';
	import { __currentPage, __quizCorrectAnswers, __quizWrongAnswers } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { quranMetaData } from '$data/quranMeta';
	import { fetchQuizData } from '$utils/guessTheWordGame';
	import { advanceQuestion, buildWordQuestion, createAyahSession, recordWordOutcome } from '$utils/guessTheWordSet';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount, tick } from 'svelte';

	let selection = null;
	let answerChecked = false;
	let isAnswerCorrect = null;
	let autoProgressTimeout = null;
	let party = null;
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

	$: currentAyah = session?.deck[session.ayahIndex];
	$: chapterName = currentAyah ? quranMetaData[currentAyah.chapter]?.translation || 'Surah ' + currentAyah.chapter : '';
	$: chapterTransliteration = currentAyah ? quranMetaData[currentAyah.chapter]?.transliteration || '' : '';
	$: isLastWord = session && session.wordIndex === currentAyah.words.length - 1;

	onMount(() => {
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateMotion = () => reducedMotion = motionQuery.matches;
		updateMotion();
		motionQuery.addEventListener('change', updateMotion);
		let script = null;
		if (typeof window.party?.confetti === 'function') {
			party = window.party;
		} else {
			script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js';
			script.async = true;
			script.onload = () => {
				if (!disposed && typeof window.party?.confetti === 'function') party = window.party;
			};
			script.onerror = () => console.warn('Confetti is unavailable. The quiz can still be played.');
			document.head.appendChild(script);
		}
		startGame();
		return () => {
			disposed = true;
			clearTimeout(autoProgressTimeout);
			motionQuery.removeEventListener('change', updateMotion);
			script?.remove();
		};
	});

	async function startGame() {
		if (isLoading || disposed) return;
		isLoading = true;
		quizError = null;
		session = null;
		try {
			const data = await fetchQuizData();
			if (disposed) return;
			quizData = data;
			previousWordKeys = [];
			showQuestion(createAyahSession(data.ayahs));
		} catch (error) {
			if (!disposed) showError(error);
		} finally {
			if (!disposed) isLoading = false;
		}
	}

	function showError(error) {
		clearTimeout(autoProgressTimeout);
		quizError = error instanceof Error ? error : new Error('Unable to load this ayah. Please try again.');
		questionReady = false;
	}

	function showQuestion(nextSession) {
		const ayah = nextSession.deck[nextSession.ayahIndex];
		const result = buildWordQuestion(
			ayah.words[nextSession.wordIndex],
			quizData.words,
			[...previousWordKeys, ...ayah.words.map((word) => word.word_key)]
		);
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
			autoProgressTimeout = setTimeout(() => continueWord(), 250);
		} else {
			sessionWrong++;
			updateSettings({ type: 'quizWrongAnswers', value: $__quizWrongAnswers + 1 });
			if (isLastWord) {
				autoProgressTimeout = setTimeout(() => continueWord(), 1800);
			} else {
				await tick();
				if (!disposed) quizControls?.focusNext();
			}
		}
	}

	function continueWord(skip = false) {
		if (!questionReady || disposed || !session || session.isComplete || (skip ? answerChecked : !answerChecked)) return;
		clearTimeout(autoProgressTimeout);
		moveFocus = true;
		if (skip) session = recordWordOutcome(session, 'skipped');
		const celebrate = isLastWord && session.outcomes.includes('correct');
		try {
			showQuestion(advanceQuestion(session));
			if (celebrate && !reducedMotion && typeof party?.confetti === 'function') {
				party.confetti(document.body, { count: 40, spread: 80, size: 1.5 });
			}
		} catch (error) {
			showError(error);
		}
	}

	__currentPage.set('Guess The Word');
</script>

<PageHead title="Guess The Word" description="Learn Quranic vocabulary by following each ayah, one word at a time." />

<div class="mx-auto w-full max-w-3xl py-5 md:py-8">
	{#if quizError}
		<ErrorLoadingData error={quizError} center={false} />
		<div class="mt-5 flex justify-center">
			<button class={buttonOutlineClasses} disabled={isLoading} on:click={startGame}>Try again</button>
		</div>
	{:else if !session}
		<div class="py-16" role="status" aria-label="Loading ayahs"><Spinner /></div>
	{:else}
		{#key currentAyah.key}
			<AyahProgress ayah={currentAyah} {chapterName} {chapterTransliteration} wordIndex={session.wordIndex} outcomes={session.outcomes} />
		{/key}
		<div class="grid min-h-[23rem] overflow-hidden md:min-h-[24rem]" inert={!questionReady}>
			{#key wordSetKey}
				<div
					class="col-start-1 row-start-1 min-w-0 py-4 outline-none md:py-6"
					tabindex="-1"
					role="group"
					aria-label={'Word ' + (session.wordIndex + 1) + ' of ' + currentAyah.words.length}
					in:fly|global={{ x: reducedMotion ? 0 : 160, duration: reducedMotion ? 0 : 250, easing: quintOut }}
					out:fly|global={{ x: reducedMotion ? 0 : -160, duration: reducedMotion ? 0 : 180, easing: quintOut }}
					on:introend={onQuestionReady}
				>
					<WordDisplay word={currentWordSet[correctAnswerIndex]} wordKey={currentWordSet[correctAnswerIndex].word_key} />
					<AnswerOptions
						wordSet={currentWordSet}
						{selection}
						on:answer={checkAnswer}
						{answerChecked}
						{isAnswerCorrect}
						isGeneratingWordSet={!questionReady}
						{correctAnswerIndex}
					/>
				</div>
			{/key}
		</div>
		<QuizControls
			bind:this={quizControls}
			{answerChecked}
			{isAnswerCorrect}
			{isLastWord}
			isGeneratingWordSet={!questionReady}
			correctAnswer={currentWordSet[correctAnswerIndex].word_english}
			on:next={() => continueWord()}
			on:skip={() => continueWord(true)}
		/>
		<QuizStats {sessionCorrect} {sessionWrong} allTimeCorrect={$__quizCorrectAnswers} allTimeWrong={$__quizWrongAnswers} />
	{/if}
</div>
