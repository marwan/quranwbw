export function normalizeTranslation(word) {
	return typeof word?.word_english === 'string' ? word.word_english.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

export function isUsableWord(word) {
	return Boolean(
		word &&
			typeof word.word_key === 'string' &&
			word.word_key &&
			typeof word.word_arabic === 'string' &&
			word.word_arabic.trim() &&
			normalizeTranslation(word)
	);
}

export function shuffleArray(array, random = Math.random) {
	const shuffled = array.slice();
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function buildWordQuestion(correctWord, allFetchedWords, excludedWordKeys = [], random = Math.random) {
	if (!Array.isArray(allFetchedWords) || allFetchedWords.length === 0) {
		throw new Error('No translated words are available for the quiz.');
	}
	if (!isUsableWord(correctWord)) throw new Error('This word has no available translation.');

	const wordCount = allFetchedWords.length;
	const excludedKeys = new Set(excludedWordKeys);
	const options = [correctWord];
	const usedKeys = new Set([correctWord.word_key]);
	const usedTranslations = new Set([normalizeTranslation(correctWord)]);
	const usedArabicWords = new Set([correctWord.word_arabic.trim()]);
	const randomStart = Math.min(wordCount - 1, Math.floor(random() * wordCount));

	// Prefer new distractors, then reuse older words only if needed.
	for (const allowPrevious of [false, true]) {
		for (let offset = 0; offset < wordCount && options.length < 4; offset++) {
			const candidate = allFetchedWords[(randomStart + offset) % wordCount];
			if (!isUsableWord(candidate) || usedKeys.has(candidate.word_key) || (!allowPrevious && excludedKeys.has(candidate.word_key))) continue;
			const translation = normalizeTranslation(candidate);
			const arabicWord = candidate.word_arabic.trim();
			if (usedTranslations.has(translation) || usedArabicWords.has(arabicWord)) continue;
			options.push(candidate);
			usedKeys.add(candidate.word_key);
			usedTranslations.add(translation);
			usedArabicWords.add(arabicWord);
		}
		if (options.length === 4) break;
	}

	if (options.length !== 4) {
		throw new Error('The quiz needs at least four distinct words and translations.');
	}

	const wordSet = shuffleArray(options, random);
	return {
		wordSet,
		correctAnswerIndex: wordSet.findIndex((word) => word.word_key === correctWord.word_key),
		previousWordKeys: wordSet.map((word) => word.word_key)
	};
}

/** Keep complete ayahs intact; never silently remove a word from their sequence. */
export function buildQuizData({ arabicWordData, translationWordData, transliterationWordData }) {
	if (!arabicWordData || !translationWordData) throw new Error('Word data is unavailable. Please try again.');
	const ayahs = [];
	const words = [];
	for (const chapter of Object.keys(arabicWordData).sort((a, b) => +a - +b)) {
		for (const verse of Object.keys(arabicWordData[chapter] || {}).sort((a, b) => +a - +b)) {
			if (!/^\d+$/.test(chapter) || !/^\d+$/.test(verse) || +chapter < 1 || +verse < 1) continue;
			const arabicWords = arabicWordData[chapter][verse]?.[0];
			if (!Array.isArray(arabicWords) || !arabicWords.length) continue;
			const translations = translationWordData[chapter]?.[verse]?.[0] || [];
			const transliterations = transliterationWordData?.[chapter]?.[verse]?.[0] || [];
			const ayahWords = arabicWords.map((arabic, index) => ({
				word_key: `${chapter}:${verse}:${index + 1}`,
				word_arabic: arabic,
				word_english: translations[index] || '',
				word_transliteration: transliterations[index] || ''
			}));
			words.push(...ayahWords.filter(isUsableWord));
			if (ayahWords.every(isUsableWord)) {
				ayahs.push({ key: `${chapter}:${verse}`, chapter: +chapter, verse: +verse, words: ayahWords });
			}
		}
	}
	if (!ayahs.length || new Set(words.map(normalizeTranslation)).size < 4) {
		throw new Error('There are not enough translated ayahs to start the quiz. Please try again.');
	}
	return { ayahs, words };
}

export function createAyahSession(ayahs, random = Math.random) {
	if (!ayahs.length) throw new Error('No ayahs are available for the quiz.');
	const deck = shuffleArray(ayahs, random);
	// Open with a manageable round. Every complete ayah remains in the deck.
	const openingIndex = deck.findIndex((ayah) => ayah.words.length >= 3 && ayah.words.length <= 12);
	if (openingIndex > 0) [deck[0], deck[openingIndex]] = [deck[openingIndex], deck[0]];
	return { deck, ayahIndex: 0, wordIndex: 0, outcomes: [], isComplete: false };
}

export function recordWordOutcome(session, outcome) {
	if (!['correct', 'wrong', 'skipped'].includes(outcome)) throw new Error('Invalid quiz outcome.');
	if (session.isComplete || session.outcomes[session.wordIndex]) return session;
	const outcomes = session.outcomes.slice();
	outcomes[session.wordIndex] = outcome;
	return { ...session, outcomes };
}

export function advanceWord(session) {
	if (session.isComplete || !session.outcomes[session.wordIndex]) return session;
	const lastWord = session.wordIndex === session.deck[session.ayahIndex].words.length - 1;
	return lastWord ? { ...session, isComplete: true } : { ...session, wordIndex: session.wordIndex + 1 };
}

export function advanceQuestion(session, random = Math.random) {
	const nextSession = advanceWord(session);
	return nextSession.isComplete ? startNextAyah(nextSession, random) : nextSession;
}

export function startNextAyah(session, random = Math.random) {
	if (!session.isComplete) return session;
	let deck = session.deck;
	let ayahIndex = session.ayahIndex + 1;
	if (ayahIndex === deck.length) {
		deck = shuffleArray(deck, random);
		if (deck.length > 1 && deck[0].key === session.deck[session.ayahIndex].key) {
			[deck[0], deck[1]] = [deck[1], deck[0]];
		}
		ayahIndex = 0;
	}
	return { deck, ayahIndex, wordIndex: 0, outcomes: [], isComplete: false };
}
