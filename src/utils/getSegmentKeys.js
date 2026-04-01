import { quranMetaData, pageNumberKeys, juzMeta, hizbMeta } from '$data/quranMeta';

// Generates a map of verse keys for each segment of the Quran.
// Each key in the returned object is a segment number (juz, hizb, or page),
// and its value is a comma-separated string of all "chapter:verse" keys in that segment.
export function getSegmentKeys(type = 'juz') {
	// Build a lookup of chapter number -> total verse count
	const verseCountByChapter = {};
	for (const chapter of quranMetaData) {
		if (chapter.id > 0) verseCountByChapter[chapter.id] = chapter.verses;
	}

	// Parse a "chapter:verse" string into a [chapterNumber, verseNumber] tuple
	function parseVerseKey(key) {
		const [chapter, verse] = key.split(':').map(Number);
		return [chapter, verse];
	}

	// Build a comma-separated string of all verse keys from start (inclusive) to end (exclusive)
	function buildVerseKeys(startChapter, startVerse, endChapter, endVerse) {
		const keys = [];
		let currentChapter = startChapter;
		let currentVerse = startVerse;

		while (currentChapter < endChapter || (currentChapter === endChapter && currentVerse < endVerse)) {
			keys.push(`${currentChapter}:${currentVerse}`);

			const totalVerses = verseCountByChapter[currentChapter];
			if (currentVerse < totalVerses) {
				// Move to next verse in the same chapter
				currentVerse++;
			} else {
				// Move to the first verse of the next chapter
				currentChapter++;
				currentVerse = 1;
			}
		}

		return keys.join(',');
	}

	const result = {};

	if (type === 'page') {
		// Each entry in pageNumberKeys is the starting verse of that page
		for (let i = 0; i < pageNumberKeys.length; i++) {
			const [startChapter, startVerse] = parseVerseKey(pageNumberKeys[i]);

			// End boundary is the start of the next page, or end of Quran for the last page
			let endChapter, endVerse;
			if (i < pageNumberKeys.length - 1) {
				[endChapter, endVerse] = parseVerseKey(pageNumberKeys[i + 1]);
			} else {
				endChapter = 114;
				endVerse = 7; // Exclusive, so 114:6 is the last verse included
			}

			result[i + 1] = buildVerseKeys(startChapter, startVerse, endChapter, endVerse);
		}
	} else {
		const meta = type === 'juz' ? juzMeta : hizbMeta;
		const segmentKey = type === 'juz' ? 'juz' : 'hizb';

		for (let i = 0; i < meta.length; i++) {
			const segment = meta[i];
			const [startChapter, startVerse] = parseVerseKey(segment.from);

			// End boundary is the start of the next segment, or end of Quran for the last segment
			let endChapter, endVerse;
			if (i < meta.length - 1) {
				[endChapter, endVerse] = parseVerseKey(meta[i + 1].from);
			} else {
				endChapter = 114;
				endVerse = 7; // Exclusive, so 114:6 is the last verse included
			}

			result[segment[segmentKey]] = buildVerseKeys(startChapter, startVerse, endChapter, endVerse);
		}
	}

	return result;
}
