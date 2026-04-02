import { quranMetaData, pageNumberKeys, juzMeta, hizbMeta } from '$data/quranMeta';

// Generates a map of verse keys for each segment of the Quran.
// Each key in the returned object is a segment number (juz, hizb, or page),
// and its value is a comma-separated string of all "chapter:verse" keys in that segment.
export async function getSegmentKeys(type = 'juz') {
	const verseCountByChapter = {};
	for (const chapter of quranMetaData) {
		if (chapter.id > 0) verseCountByChapter[chapter.id] = chapter.verses;
	}

	function parseVerseKey(key) {
		const [chapter, verse] = key.split(':').map(Number);
		return [chapter, verse];
	}

	function buildVerseKeys(startChapter, startVerse, endChapter, endVerse) {
		const keys = [];
		let currentChapter = startChapter;
		let currentVerse = startVerse;

		while (currentChapter < endChapter || (currentChapter === endChapter && currentVerse < endVerse)) {
			keys.push(`${currentChapter}:${currentVerse}`);

			const totalVerses = verseCountByChapter[currentChapter];
			if (currentVerse < totalVerses) {
				currentVerse++;
			} else {
				currentChapter++;
				currentVerse = 1;
			}
		}

		return keys.join(',');
	}

	const result = {};

	if (type === 'page') {
		for (let i = 0; i < pageNumberKeys.length; i++) {
			const [startChapter, startVerse] = parseVerseKey(pageNumberKeys[i]);

			let endChapter, endVerse;
			if (i < pageNumberKeys.length - 1) {
				[endChapter, endVerse] = parseVerseKey(pageNumberKeys[i + 1]);
			} else {
				endChapter = 114;
				endVerse = 7;
			}

			result[i + 1] = buildVerseKeys(startChapter, startVerse, endChapter, endVerse);
		}
	} else {
		const meta = type === 'juz' ? juzMeta : hizbMeta;
		const segmentKey = type === 'juz' ? 'juz' : 'hizb';

		for (let i = 0; i < meta.length; i++) {
			const segment = meta[i];
			const [startChapter, startVerse] = parseVerseKey(segment.from);

			let endChapter, endVerse;
			if (i < meta.length - 1) {
				[endChapter, endVerse] = parseVerseKey(meta[i + 1].from);
			} else {
				endChapter = 114;
				endVerse = 7;
			}

			result[segment[segmentKey]] = buildVerseKeys(startChapter, startVerse, endChapter, endVerse);
		}
	}

	// Yield to the browser's event loop before resolving, mimicking network async behaviour.
	// This ensures URL params (like startKey) are fully processed before FullVersesDisplay mounts.
	await new Promise((resolve) => setTimeout(resolve, 0));

	return result;
}
