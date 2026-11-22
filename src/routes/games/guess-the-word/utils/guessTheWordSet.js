// Cleans up a word's English translation for comparing: trims, collapses extra spaces, lowercases.
// Returns '' if the word has no text translation.
export function normalizeTranslation(word) {
	return typeof word?.word_english === 'string' ? word.word_english.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

// Checks if a word can be used in the quiz: it needs a key, Arabic text and a real translation.
function isUsableWord(word) {
	return Boolean(
		word &&
		typeof word.word_key === 'string' &&
		word.word_key &&
		typeof word.word_arabic === 'string' &&
		word.word_arabic.trim() &&
		// Some translations use placeholders such as "*" for untranslated words, so require at least one letter or number.
		/[\p{L}\p{N}]/u.test(normalizeTranslation(word))
	);
}

// Returns a randomly shuffled copy of the array (Fisher-Yates). The original array is not changed.
// `random` can be swapped out, which is useful for testing.
export function shuffleArray(array, random = Math.random) {
	const shuffled = array.slice();
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// Two options whose translations are closer than this (0 = identical, 1 = totally different) look too alike.
export const minTranslationDistance = 0.4;

// Shared cleaning for translationCore and translationPlain: removes punctuation and a leading "and".
// With `removeBrackets`, words inside (...) and [...] are removed too.
function cleanTranslation(word, removeBrackets) {
	const translation = normalizeTranslation(word);
	const withoutBrackets = removeBrackets ? translation.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ') : translation;
	const cleaned = withoutBrackets
		.replace(/[^\p{L}\p{N}\s]/gu, ' ') // remove punctuation
		.replace(/^\s*and\s+/, '') // remove a leading "and"
		.replace(/\s+/g, ' ')
		.trim();
	// If everything got removed, fall back to the original translation.
	return cleaned || translation;
}

// The main meaning of a translation, with bracketed words, punctuation and a leading "and" removed.
// Example: "and (of) Allah" -> "allah".
export function translationCore(word) {
	return cleanTranslation(word, true);
}

// Like translationCore, but keeps the words inside brackets. Example: "(do) not" -> "do not".
export function translationPlain(word) {
	return cleanTranslation(word, false);
}

// Both ways of reading a translation: [core, plain]. Two options look alike if either reading is close.
// The core catches "(of) Allah" vs "Allah", the plain form catches "(do) not" vs "do not".
function translationForms(word) {
	return [translationCore(word), translationPlain(word)];
}

// Checks if two words look alike by comparing their core forms together and their plain forms together.
function looksAlike(formsA, formsB) {
	return formsA.some((a, index) => translationDistance(a, formsB[index]) < minTranslationDistance);
}

// Counts how many single-letter edits (add, remove, change) turn text a into text b.
function levenshtein(a, b) {
	if (a === b) return 0;
	// `previous` holds the distances for the previous row of the comparison table.
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			// Cheapest of: remove a letter, add a letter, or change a letter (free if the letters already match).
			current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		}
		previous = current;
	}
	return previous[b.length];
}

// How different two texts are, from 0 (identical) to 1 (completely different).
export function translationDistance(a, b) {
	const longest = Math.max(a.length, b.length);
	return longest === 0 ? 0 : levenshtein(a, b) / longest;
}

// Builds one quiz question: the correct word plus 3 wrong options, shuffled.
// - correctWord: the word the player is asked about
// - allFetchedWords: the pool that wrong options are picked from
// - excludedWordKeys: words used in the previous question, avoided where possible so options feel fresh
// Returns the 4 words, the index of the correct one, and their keys (to exclude next time).
export function buildWordQuestion(correctWord, allFetchedWords, excludedWordKeys = [], random = Math.random) {
	if (!Array.isArray(allFetchedWords) || allFetchedWords.length === 0) {
		throw new Error('No translated words are available for the quiz.');
	}
	if (!isUsableWord(correctWord)) throw new Error('This word has no available translation.');

	const wordCount = allFetchedWords.length;
	const excludedKeys = new Set(excludedWordKeys);
	const options = [correctWord];
	// Track what is already chosen so no option repeats a translation or an Arabic text.
	const usedTranslations = new Set([normalizeTranslation(correctWord)]);
	const usedArabicWords = new Set([correctWord.word_arabic.trim()]);
	const usedForms = [translationForms(correctWord)];
	// Start looking at a random position in the pool so the wrong options differ every time.
	const randomStart = Math.floor(random() * wordCount);

	// Pick in rounds, strictest first: prefer wrong options that look unlike every chosen option and were not
	// in the last question, then allow older words, and only accept look-alike translations as a last resort.
	const passes = [
		{ requireDistinct: true, allowPrevious: false },
		{ requireDistinct: true, allowPrevious: true },
		{ requireDistinct: false, allowPrevious: false },
		{ requireDistinct: false, allowPrevious: true }
	];
	for (const { requireDistinct, allowPrevious } of passes) {
		for (let offset = 0; offset < wordCount && options.length < 4; offset++) {
			// Walk through the pool from the random start, wrapping around at the end.
			const candidate = allFetchedWords[(randomStart + offset) % wordCount];
			if (!isUsableWord(candidate) || (!allowPrevious && excludedKeys.has(candidate.word_key))) continue;
			const translation = normalizeTranslation(candidate);
			const arabicWord = candidate.word_arabic.trim();
			if (usedTranslations.has(translation) || usedArabicWords.has(arabicWord)) continue;
			const forms = translationForms(candidate);
			if (requireDistinct && usedForms.some((used) => looksAlike(forms, used))) continue;
			options.push(candidate);
			usedTranslations.add(translation);
			usedArabicWords.add(arabicWord);
			usedForms.push(forms);
		}
	}

	if (options.length !== 4) {
		throw new Error('The quiz needs at least four distinct words and translations.');
	}

	// Shuffle so the correct answer is not always first, then find where it ended up.
	const wordSet = shuffleArray(options, random);
	return {
		wordSet,
		correctAnswerIndex: wordSet.findIndex((word) => word.word_key === correctWord.word_key),
		previousWordKeys: wordSet.map((word) => word.word_key)
	};
}

// Converts the fetched Quran data into what the quiz needs:
// - ayahs: every ayah with all its words, in order
// - words: a flat list of all askable words (used for picking wrong options)
// Ayahs stay intact. Words without a real meaning (missing, or a placeholder such as "*" where the meaning
// is folded into a neighbouring word) stay in the ayah but are marked as not askable, and play skips them.
export function buildQuizData({ arabicWordData, translationWordData, transliterationWordData }) {
	if (!arabicWordData || !translationWordData) throw new Error('Word data is unavailable. Please try again.');
	const ayahs = [];
	const words = [];
	// Go through chapters and verses in numeric order.
	for (const chapter of Object.keys(arabicWordData).sort((a, b) => +a - +b)) {
		for (const verse of Object.keys(arabicWordData[chapter] || {}).sort((a, b) => +a - +b)) {
			// Ignore any key that is not a valid chapter or verse number.
			if (!/^\d+$/.test(chapter) || !/^\d+$/.test(verse) || +chapter < 1 || +verse < 1) continue;
			const arabicWords = arabicWordData[chapter][verse]?.[0];
			if (!Array.isArray(arabicWords) || !arabicWords.length) continue;
			const translations = translationWordData[chapter]?.[verse]?.[0] || [];
			const transliterations = transliterationWordData?.[chapter]?.[verse]?.[0] || [];
			// Build each word object, e.g. key "2:255:3" is the 3rd word of verse 2:255.
			const ayahWords = arabicWords.map((arabic, index) => ({
				word_key: `${chapter}:${verse}:${index + 1}`,
				word_arabic: arabic,
				word_english: translations[index] || '',
				word_transliteration: transliterations[index] || ''
			}));
			for (const word of ayahWords) word.askable = isUsableWord(word);
			words.push(...ayahWords.filter(isAskable));
			// Skip ayahs that have no askable word at all.
			if (ayahWords.some(isAskable)) {
				ayahs.push({ key: `${chapter}:${verse}`, chapter: +chapter, verse: +verse, words: ayahWords });
			}
		}
	}
	// We need at least 4 different translations, otherwise a question with 4 options is impossible.
	if (!ayahs.length || new Set(words.map(normalizeTranslation)).size < 4) {
		throw new Error('There are not enough translated ayahs to start the quiz. Please try again.');
	}
	return { ayahs, words };
}

// Checks if the player should be asked about this word. Words without the flag (built elsewhere) count as askable.
export function isAskable(word) {
	return word.askable !== false;
}

// List of positions of the askable words inside an ayah, e.g. [0, 1, 3] if the 3rd word is not askable.
export function askableIndexes(ayah) {
	return ayah.words.flatMap((word, index) => (isAskable(word) ? [index] : []));
}

// Position of the next askable word after the given position in the ayah, or -1 if there is none left.
function nextAskableIndex(ayah, after) {
	for (let index = after + 1; index < ayah.words.length; index++) if (isAskable(ayah.words[index])) return index;
	return -1;
}

// Checks if the current word is the last one the player will be asked about in the current ayah.
export function isLastAskableWord(session) {
	return nextAskableIndex(session.deck[session.ayahIndex], session.wordIndex) === -1;
}

// Starts a new game session. The session holds:
// - deck: the ayahs to play, in order
// - ayahIndex / wordIndex: where the player currently is
// - outcomes: result of each word in the current ayah ('correct', 'wrong' or 'skipped')
// - isComplete: true once the current ayah is finished
// Ayahs are shuffled by default and start with a manageable one. With `ordered`, the ayahs are played in the
// given order (used for an ayah range) and the deck starts over from the first ayah after the last one.
export function createAyahSession(ayahs, random = Math.random, { ordered = false } = {}) {
	if (!ayahs.length) throw new Error('No ayahs are available for the quiz.');
	const deck = ordered ? ayahs.slice() : shuffleArray(ayahs, random);
	if (!ordered) {
		// Open with a first ayah of 3-12 words (not too short or long) by swapping it to the front.
		// Every ayah stays in the deck.
		const openingIndex = deck.findIndex((ayah) => ayah.words.length >= 3 && ayah.words.length <= 12);
		if (openingIndex > 0) [deck[0], deck[openingIndex]] = [deck[openingIndex], deck[0]];
	}
	return { deck, ordered, ayahIndex: 0, wordIndex: nextAskableIndex(deck[0], -1), outcomes: [], isComplete: false };
}

// The ayah that comes after the current one, so it can be shown or preloaded. Returns null if unknown.
export function upcomingAyah(session) {
	if (!session) return null;
	const next = session.deck[session.ayahIndex + 1];
	if (next) return next;
	// In ordered mode the deck wraps around to its first ayah.
	return session.ordered && session.deck.length > 1 ? session.deck[0] : null;
}

// Saves the result ('correct', 'wrong' or 'skipped') for the current word and returns the updated session.
// Does nothing if the ayah is finished or this word already has a result.
export function recordWordOutcome(session, outcome) {
	if (!['correct', 'wrong', 'skipped'].includes(outcome)) throw new Error('Invalid quiz outcome.');
	if (session.isComplete || session.outcomes[session.wordIndex]) return session;
	const outcomes = session.outcomes.slice();
	outcomes[session.wordIndex] = outcome;
	return { ...session, outcomes };
}

// Moves to the next askable word in the current ayah. If there is none, marks the ayah as complete.
// Does nothing until the current word has a result.
export function advanceWord(session) {
	if (session.isComplete || !session.outcomes[session.wordIndex]) return session;
	const next = nextAskableIndex(session.deck[session.ayahIndex], session.wordIndex);
	return next === -1 ? { ...session, isComplete: true } : { ...session, wordIndex: next };
}

// Moves forward one step: the next word, or the first word of the next ayah if this ayah is finished.
export function advanceQuestion(session, random = Math.random) {
	const nextSession = advanceWord(session);
	return nextSession.isComplete ? startNextAyah(nextSession, random) : nextSession;
}

// Leaves the current ayah where it is and goes to the next one. Its remaining words are not counted.
export function skipAyah(session, random = Math.random) {
	return startNextAyah({ ...session, isComplete: true }, random);
}

// Starts the next ayah once the current one is complete, with fresh outcomes.
// When the deck runs out it starts again from the top: reshuffled normally, or the same order in ordered mode.
export function startNextAyah(session, random = Math.random) {
	if (!session.isComplete) return session;
	const ordered = Boolean(session.ordered);
	let deck = session.deck;
	let ayahIndex = session.ayahIndex + 1;
	if (ayahIndex === deck.length) {
		if (!ordered) {
			deck = shuffleArray(deck, random);
			// Avoid showing the same ayah twice in a row after a reshuffle.
			if (deck.length > 1 && deck[0].key === session.deck[session.ayahIndex].key) {
				[deck[0], deck[1]] = [deck[1], deck[0]];
			}
		}
		ayahIndex = 0;
	}
	return { deck, ordered, ayahIndex, wordIndex: nextAskableIndex(deck[ayahIndex], -1), outcomes: [], isComplete: false };
}
