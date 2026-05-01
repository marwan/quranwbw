import { quranMetaData, pageNumberKeys, juzNumberKeys, hizbNumberKeys } from '$data/quranMeta';

// Generates a map of verse keys for each segment of the Quran.
// Each key in the returned object is a segment number (juz, hizb, or page),
// and its value is a comma-separated string of all "chapter:verse" keys in that segment.
// e.g. { 1: '1:1,1:2,1:3,...,2:141', 2: '2:142,...' }
export async function getSegmentKeys(type = 'juz') {
	// Build a lookup table of chapter number -> total verse count
	// e.g. { 1: 7, 2: 286, 3: 200, ... }
	// Used during verse iteration to know when to roll over to the next chapter
	const verseCountByChapter = {};
	for (const chapter of quranMetaData) {
		if (chapter.id > 0) verseCountByChapter[chapter.id] = chapter.verses;
	}

	// Converts a "chapter:verse" string into a [chapterNumber, verseNumber] array
	// e.g. '2:255' -> [2, 255]
	function parseVerseKey(key) {
		const [chapter, verse] = key.split(':').map(Number);
		return [chapter, verse];
	}

	// Iterates verse by verse from start (inclusive) to end (exclusive),
	// rolling over to the next chapter when the last verse of a chapter is reached.
	// Returns all visited keys as a single comma-separated string.
	// e.g. buildVerseKeys(1, 1, 2, 1) -> '1:1,1:2,1:3,1:4,1:5,1:6,1:7'
	function buildVerseKeys(startChapter, startVerse, endChapter, endVerse) {
		const keys = [];
		let currentChapter = startChapter;
		let currentVerse = startVerse;

		// Keep going until we reach the exclusive end boundary
		while (currentChapter < endChapter || (currentChapter === endChapter && currentVerse < endVerse)) {
			keys.push(`${currentChapter}:${currentVerse}`);

			const totalVerses = verseCountByChapter[currentChapter];
			if (currentVerse < totalVerses) {
				// Still more verses in this chapter, move to the next verse
				currentVerse++;
			} else {
				// Reached the last verse of this chapter, roll over to the next chapter
				currentChapter++;
				currentVerse = 1;
			}
		}

		// Join all collected keys into a single comma-separated string
		return keys.join(',');
	}

	// Pick the correct flat array of starting verse keys based on type
	// All three are the same shape: ['1:1', '2:1', ...] — one entry per segment
	const startingKeys = type === 'juz' ? juzNumberKeys : type === 'hizb' ? hizbNumberKeys : pageNumberKeys;

	// The final result object: { segmentNumber: 'chapter:verse,...' }
	const result = {};

	for (let i = 0; i < startingKeys.length; i++) {
		const [startChapter, startVerse] = parseVerseKey(startingKeys[i]);

		// End boundary is the start of the next segment (exclusive),
		// or 114:7 for the last segment (making 114:6 the last included verse)
		let endChapter, endVerse;
		if (i < startingKeys.length - 1) {
			[endChapter, endVerse] = parseVerseKey(startingKeys[i + 1]);
		} else {
			endChapter = 114;
			endVerse = 7;
		}

		// Segment numbers are 1-based, so use i + 1 as the key
		result[i + 1] = buildVerseKeys(startChapter, startVerse, endChapter, endVerse);
	}

	// Yield to the browser's event loop before resolving, mimicking network async behaviour.
	// This ensures URL params (like startKey) are fully processed before FullVersesDisplay mounts.
	// Without this, the synchronous result resolves too fast for SvelteKit's navigation to catch up.
	await new Promise((resolve) => setTimeout(resolve, 0));

	return result;
}
