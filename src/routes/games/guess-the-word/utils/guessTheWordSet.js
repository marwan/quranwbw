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
			// Some translations use placeholders such as "*" for words they leave untranslated.
			/[\p{L}\p{N}]/u.test(normalizeTranslation(word))
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

// Options whose translations are closer than this (Levenshtein distance divided by the longer length) look too alike.
export const MIN_TRANSLATION_DISTANCE = 0.4;

/** The meaning-bearing part of a translation: no bracketed glosses, punctuation, or leading "and". */
export function translationCore(word) {
	const translation = normalizeTranslation(word);
	const core = translation
		.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/^\s*and\s+/, '')
		.replace(/\s+/g, ' ')
		.trim();
	return core || translation;
}

/** The translation with punctuation removed but bracketed words kept: "(do) not" → "do not". */
export function translationPlain(word) {
	const translation = normalizeTranslation(word);
	const plain = translation
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/^\s*and\s+/, '')
		.replace(/\s+/g, ' ')
		.trim();
	return plain || translation;
}

/**
 * Both ways of reading a translation. Two options look alike when either reading is close:
 * the core catches "(of) Allah" / "Allah", the plain form catches "(do) not" / "do not".
 */
function translationForms(word) {
	return [translationCore(word), translationPlain(word)];
}

function looksAlike(formsA, formsB) {
	return formsA.some((a, index) => translationDistance(a, formsB[index]) < MIN_TRANSLATION_DISTANCE);
}

export function levenshtein(a, b) {
	if (a === b) return 0;
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		}
		previous = current;
	}
	return previous[b.length];
}

/** 0 for identical translation cores, 1 for completely different ones. */
export function translationDistance(a, b) {
	const longest = Math.max(a.length, b.length);
	return longest === 0 ? 0 : levenshtein(a, b) / longest;
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
	const usedForms = [translationForms(correctWord)];
	const randomStart = Math.min(wordCount - 1, Math.floor(random() * wordCount));

	// Greedy pick: prefer distractors that look unlike every chosen option and are new,
	// then allow older words, and only accept look-alike translations as a last resort.
	const passes = [
		{ requireDistinct: true, allowPrevious: false },
		{ requireDistinct: true, allowPrevious: true },
		{ requireDistinct: false, allowPrevious: false },
		{ requireDistinct: false, allowPrevious: true }
	];
	for (const { requireDistinct, allowPrevious } of passes) {
		for (let offset = 0; offset < wordCount && options.length < 4; offset++) {
			const candidate = allFetchedWords[(randomStart + offset) % wordCount];
			if (!isUsableWord(candidate) || usedKeys.has(candidate.word_key) || (!allowPrevious && excludedKeys.has(candidate.word_key))) continue;
			const translation = normalizeTranslation(candidate);
			const arabicWord = candidate.word_arabic.trim();
			if (usedTranslations.has(translation) || usedArabicWords.has(arabicWord)) continue;
			const forms = translationForms(candidate);
			if (requireDistinct && usedForms.some((used) => looksAlike(forms, used))) continue;
			options.push(candidate);
			usedKeys.add(candidate.word_key);
			usedTranslations.add(translation);
			usedArabicWords.add(arabicWord);
			usedForms.push(forms);
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

/**
 * Keep ayahs intact; never silently remove a word from their sequence. Words without a real meaning in the
 * chosen language (missing, or a placeholder such as "*" where the meaning is folded into a neighbour) stay in
 * the ayah but are marked not askable, and play skips over them.
 */
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
			for (const word of ayahWords) word.askable = isUsableWord(word);
			words.push(...ayahWords.filter(isAskable));
			if (ayahWords.some(isAskable)) {
				ayahs.push({ key: `${chapter}:${verse}`, chapter: +chapter, verse: +verse, words: ayahWords });
			}
		}
	}
	if (!ayahs.length || new Set(words.map(normalizeTranslation)).size < 4) {
		throw new Error('There are not enough translated ayahs to start the quiz. Please try again.');
	}
	return { ayahs, words };
}

/** Words the player is asked about. Words without the flag (built elsewhere) count as askable. */
export function isAskable(word) {
	return word.askable !== false;
}

export function askableIndexes(ayah) {
	return ayah.words.flatMap((word, index) => (isAskable(word) ? [index] : []));
}

function nextAskableIndex(ayah, after) {
	for (let index = after + 1; index < ayah.words.length; index++) if (isAskable(ayah.words[index])) return index;
	return -1;
}

export function isLastAskableWord(session) {
	return nextAskableIndex(session.deck[session.ayahIndex], session.wordIndex) === -1;
}

/**
 * Shuffled by default, opening with a manageable ayah. With `ordered`, the ayahs are played in the given
 * order (an ayah range) and the deck starts over from the first ayah after the last one.
 */
export function createAyahSession(ayahs, random = Math.random, { ordered = false } = {}) {
	if (!ayahs.length) throw new Error('No ayahs are available for the quiz.');
	const deck = ordered ? ayahs.slice() : shuffleArray(ayahs, random);
	if (!ordered) {
		// Open with a manageable round. Every complete ayah remains in the deck.
		const openingIndex = deck.findIndex((ayah) => ayah.words.length >= 3 && ayah.words.length <= 12);
		if (openingIndex > 0) [deck[0], deck[openingIndex]] = [deck[openingIndex], deck[0]];
	}
	return { deck, ordered, ayahIndex: 0, wordIndex: nextAskableIndex(deck[0], -1), outcomes: [], isComplete: false };
}

/** The ayah that comes after the current one, when it is already known. */
export function upcomingAyah(session) {
	if (!session) return null;
	const next = session.deck[session.ayahIndex + 1];
	if (next) return next;
	return session.ordered && session.deck.length > 1 ? session.deck[0] : null;
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
	const next = nextAskableIndex(session.deck[session.ayahIndex], session.wordIndex);
	return next === -1 ? { ...session, isComplete: true } : { ...session, wordIndex: next };
}

export function advanceQuestion(session, random = Math.random) {
	const nextSession = advanceWord(session);
	return nextSession.isComplete ? startNextAyah(nextSession, random) : nextSession;
}

export function startNextAyah(session, random = Math.random) {
	if (!session.isComplete) return session;
	const ordered = Boolean(session.ordered);
	let deck = session.deck;
	let ayahIndex = session.ayahIndex + 1;
	if (ayahIndex === deck.length) {
		if (!ordered) {
			deck = shuffleArray(deck, random);
			if (deck.length > 1 && deck[0].key === session.deck[session.ayahIndex].key) {
				[deck[0], deck[1]] = [deck[1], deck[0]];
			}
		}
		ayahIndex = 0;
	}
	return { deck, ordered, ayahIndex, wordIndex: nextAskableIndex(deck[ayahIndex], -1), outcomes: [], isComplete: false };
}
