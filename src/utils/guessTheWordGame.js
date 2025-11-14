import { fetchWordData } from './fetchData';

/**
 * Fetches all word data and returns the full list of word entries
 * with their Arabic, transliteration, and translation.
 * Note: Despite the name, this now returns the complete dataset shuffled once.
 */
export async function fetchRandomWords() {
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

	// Shuffle once to avoid bias at the start of the session
	return shuffleArray(allWordEntries);
}

export function normalizeTranslation(word) {
	return (word?.word_english || '').trim().toLowerCase();
}

export function shuffleArray(array) {
	const a = array.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export async function buildUniqueWordSet(correctWord, allFetchedWords, currentWordIndex, excludeKeys = new Set()) {
	const requiredOptions = 4;
	const options = [correctWord];
	const seenTranslations = new Set([normalizeTranslation(correctWord)]);
	const usedKeys = new Set([correctWord.word_key]);
	const adjustedExclude = new Set(excludeKeys);
	adjustedExclude.delete(correctWord.word_key);

	let candidatePool = shuffleArray(
		allFetchedWords.filter(
			(word, idx) =>
				idx !== currentWordIndex &&
				!usedKeys.has(word.word_key) &&
				!adjustedExclude.has(word.word_key)
		)
	);

	while (options.length < requiredOptions && candidatePool.length > 0) {
		const candidate = candidatePool.shift();
		if (!candidate) continue;

		usedKeys.add(candidate.word_key);

		const normalized = normalizeTranslation(candidate);
		if (!normalized || seenTranslations.has(normalized) || adjustedExclude.has(candidate.word_key)) {
			continue;
		}

		options.push(candidate);
		seenTranslations.add(normalized);
	}

	if (options.length < requiredOptions) {
		return null;
	}

	return shuffleArray(options);
}

/**
 * Generates the next word set for the quiz
 */
export async function generateNextWordSet(allFetchedWords, currentWordIndex, previousWordKeys) {
	const excludeKeys = new Set(previousWordKeys);

	if (allFetchedWords.length === 0) {
		allFetchedWords = await fetchRandomWords();
	}

	// Pick a correct word that wasn't part of the previous question and has a non-empty translation
	let correctWord = null;
	const maxSearch = Math.max(10, allFetchedWords.length);
	let searchAttempts = 0;

	while (!correctWord && searchAttempts < maxSearch) {
		currentWordIndex = (currentWordIndex + 1) % allFetchedWords.length;
		const candidate = allFetchedWords[currentWordIndex];
		const normalized = normalizeTranslation(candidate);
		if (normalized && !excludeKeys.has(candidate.word_key)) {
			correctWord = candidate;
			break;
		}
		searchAttempts++;
	}

	// If still not found (extremely unlikely), use current index
	if (!correctWord) {
		correctWord = allFetchedWords[currentWordIndex];
	}

	let attempts = 0;
	let preparedWordSet = null;
	const MAX_ATTEMPTS = 5;

	while (attempts < MAX_ATTEMPTS && !preparedWordSet) {
		preparedWordSet = await buildUniqueWordSet(correctWord, allFetchedWords, currentWordIndex, excludeKeys);

		if (!preparedWordSet) {
			// Try a different correct word in the same dataset
			currentWordIndex = (currentWordIndex + 1) % allFetchedWords.length;
			correctWord = allFetchedWords[currentWordIndex];
			attempts++;
		}
	}

	if (!preparedWordSet) {
		// Fallback: pick three others with non-empty, unique translations
		const baseNormalized = normalizeTranslation(correctWord);
		const others = [];
		const seen = new Set([baseNormalized]);
		for (let i = 0; i < allFetchedWords.length && others.length < 3; i++) {
			if (i === currentWordIndex) continue;
			const w = allFetchedWords[i];
			if (excludeKeys.has(w.word_key)) continue;
			const norm = normalizeTranslation(w);
			if (!norm || seen.has(norm)) continue;
			seen.add(norm);
			others.push(w);
		}

		// If still not enough, relax constraints but avoid using the same index
		if (others.length < 3) {
			for (let i = 0; i < allFetchedWords.length && others.length < 3; i++) {
				if (i === currentWordIndex) continue;
				const w = allFetchedWords[i];
				if (excludeKeys.has(w.word_key)) continue;
				others.push(w);
			}
		}

		preparedWordSet = shuffleArray([correctWord, ...others.slice(0, 3)]);
	}

	const correctAnswerIndex = preparedWordSet.findIndex((word) => word.word_key === correctWord.word_key);
	const newPreviousWordKeys = preparedWordSet.map((word) => word.word_key);

	return {
		wordSet: preparedWordSet,
		correctAnswerIndex,
		allFetchedWords,
		currentWordIndex,
		previousWordKeys: newPreviousWordKeys
	};
}
