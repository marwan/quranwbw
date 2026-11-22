import { quranMetaData } from '$data/quranMeta';
import { selectableWordTranslations } from '$data/options';

// Translation id used when nothing valid is chosen (1 = English).
export const defaultWordTranslation = 1;

// Word-by-word languages offered in the game: English (1) and French (11).
export const gameWordTranslations = [1, 11].map((id) => selectableWordTranslations[id]);

// Goes through the given values (e.g. URL param, saved setting) and returns the first one that is a
// language the game supports. Falls back to English if none match.
export function resolveWordTranslation(...candidates) {
	for (const candidate of candidates) {
		const id = Number(candidate);
		// Skip empty values, because Number(null) and Number('') would both turn into 0.
		if (candidate !== null && candidate !== '' && gameWordTranslations.some((language) => language.id === id)) return id;
	}
	return defaultWordTranslation;
}

// Turns text like "2:106" into { chapter: 2, verse: 106, key: '2:106' }.
// Returns null if the text is not a real ayah (bad format, chapter outside 1-114, or verse beyond the chapter's length).
export function parseAyahKey(value) {
	// Accepts 1-3 digits, a colon, 1-3 digits; spaces around the numbers are allowed.
	const match = /^\s*(\d{1,3})\s*:\s*(\d{1,3})\s*$/.exec(String(value ?? ''));
	if (!match) return null;
	const chapter = Number(match[1]);
	const verse = Number(match[2]);
	if (chapter < 1 || chapter > 114 || verse < 1 || verse > quranMetaData[chapter].verses) return null;
	return { chapter, verse, key: `${chapter}:${verse}` };
}

// Sorting helper: negative if ayah a comes first in the Quran, positive if b comes first, 0 if the same.
export function compareAyahs(a, b) {
	return a.chapter - b.chapter || a.verse - b.verse;
}

// Builds a { from, to } range out of two ayah keys. If they are given backwards they are swapped.
// Returns null if either key is invalid, which means "play the whole Quran".
export function parseAyahRange(from, to) {
	const start = parseAyahKey(from);
	const end = parseAyahKey(to);
	if (!start || !end) return null;
	return compareAyahs(start, end) <= 0 ? { from: start, to: end } : { from: end, to: start };
}

// Checks if an ayah falls inside the range. No range means everything is allowed.
export function isAyahInRange(ayah, range) {
	return !range || (compareAyahs(ayah, range.from) >= 0 && compareAyahs(ayah, range.to) <= 0);
}

// Creates the URL query string that reproduces this game setup, so it can be shared.
// Example: lang=1&from=2:106&to=2:205
export function gameQueryString({ wordTranslation, range }) {
	const params = new URLSearchParams({ lang: String(wordTranslation) });
	if (range) {
		params.set('from', range.from.key);
		params.set('to', range.to.key);
	}
	// URLSearchParams encodes ":" as "%3A"; turn it back so the link stays readable.
	return params.toString().replaceAll('%3A', ':');
}

// Text shown to the player for the selected range, e.g. "2:106 – 2:205" or "Whole Quran".
export function describeRange(range) {
	return range ? `${range.from.key} – ${range.to.key}` : 'Whole Quran';
}
