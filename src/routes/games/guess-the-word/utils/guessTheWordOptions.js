import { quranMetaData } from '$data/quranMeta';
import { selectableWordTranslations } from '$data/options';

export const defaultWordTranslation = 1;

// Word-by-word languages offered in the game: English and French.
export const gameWordTranslations = [1, 11].map((id) => selectableWordTranslations[id]);

/** The first candidate that is one of the game's languages, or English. */
export function resolveWordTranslation(...candidates) {
	for (const candidate of candidates) {
		const id = Number(candidate);
		if (candidate !== null && candidate !== '' && gameWordTranslations.some((language) => language.id === id)) return id;
	}
	return defaultWordTranslation;
}

/** "2:106" → { chapter: 2, verse: 106, key: '2:106' }, or null when it is not a real ayah. */
export function parseAyahKey(value) {
	const match = /^\s*(\d{1,3})\s*:\s*(\d{1,3})\s*$/.exec(String(value ?? ''));
	if (!match) return null;
	const chapter = Number(match[1]);
	const verse = Number(match[2]);
	if (chapter < 1 || chapter > 114 || verse < 1 || verse > quranMetaData[chapter].verses) return null;
	return { chapter, verse, key: `${chapter}:${verse}` };
}

export function compareAyahs(a, b) {
	return a.chapter - b.chapter || a.verse - b.verse;
}

/** A range from two ayah keys (swapped when given backwards), or null for the whole Quran. */
export function parseAyahRange(from, to) {
	const start = parseAyahKey(from);
	const end = parseAyahKey(to);
	if (!start || !end) return null;
	return compareAyahs(start, end) <= 0 ? { from: start, to: end } : { from: end, to: start };
}

export function isAyahInRange(ayah, range) {
	return !range || (compareAyahs(ayah, range.from) >= 0 && compareAyahs(ayah, range.to) <= 0);
}

/** Query string that reproduces the game, kept readable for sharing: lang=1&from=2:106&to=2:205 */
export function gameQueryString({ wordTranslation, range }) {
	const params = new URLSearchParams({ lang: String(wordTranslation) });
	if (range) {
		params.set('from', range.from.key);
		params.set('to', range.to.key);
	}
	return params.toString().replaceAll('%3A', ':');
}

export function describeRange(range) {
	return range ? `${range.from.key} – ${range.to.key}` : 'Whole Quran';
}
