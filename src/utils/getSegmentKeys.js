import { quranMetaData, pageNumberKeys, juzMeta, hizbMeta } from '$data/quranMeta';

export function getSegmentKeys(type = 'juz') {
	// Build a lookup: surahId -> verse count
	const verseCounts = {};
	for (const surah of quranMetaData) {
		if (surah.id > 0) verseCounts[surah.id] = surah.verses;
	}

	function parseKey(str) {
		const [s, v] = str.split(':').map(Number);
		return [s, v];
	}

	function buildKeys(startSurah, startVerse, endSurah, endVerse) {
		const keys = [];
		let s = startSurah;
		let v = startVerse;

		while (s < endSurah || (s === endSurah && v < endVerse)) {
			keys.push(`${s}:${v}`);
			const totalVerses = verseCounts[s];
			if (v < totalVerses) {
				v++;
			} else {
				s++;
				v = 1;
			}
		}

		return keys.join(',');
	}

	const result = {};

	if (type === 'page') {
		for (let i = 0; i < pageNumberKeys.length; i++) {
			const [startSurah, startVerse] = parseKey(pageNumberKeys[i]);

			let endSurah, endVerse;
			if (i < pageNumberKeys.length - 1) {
				[endSurah, endVerse] = parseKey(pageNumberKeys[i + 1]);
			} else {
				endSurah = 114;
				endVerse = 7;
			}

			result[i + 1] = buildKeys(startSurah, startVerse, endSurah, endVerse);
		}
	} else {
		const meta = type === 'juz' ? juzMeta : hizbMeta;
		const segmentKey = type === 'juz' ? 'juz' : 'hizb';

		for (let i = 0; i < meta.length; i++) {
			const segment = meta[i];
			const [startSurah, startVerse] = parseKey(segment.from);

			let endSurah, endVerse;
			if (i < meta.length - 1) {
				[endSurah, endVerse] = parseKey(meta[i + 1].from);
			} else {
				endSurah = 114;
				endVerse = 7;
			}

			result[segment[segmentKey]] = buildKeys(startSurah, startVerse, endSurah, endVerse);
		}
	}

	return result;
}

window.getSegmentKeys = getSegmentKeys;
