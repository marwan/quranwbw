import { quranMetaData } from '$data/quranMeta';

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

// Creates the URL query string that reproduces the chosen range, so it can be shared.
// Example: from=2:106&to=2:205 (empty text for the whole Quran)
export function gameQueryString(range) {
	if (!range) return '';
	const params = new URLSearchParams({ from: range.from.key, to: range.to.key });
	// URLSearchParams encodes ":" as "%3A"; turn it back so the link stays readable.
	return params.toString().replaceAll('%3A', ':');
}

// Text shown to the player for the selected range, e.g. "2:106 – 2:205" or "Whole Quran".
export function describeRange(range) {
	return range ? `${range.from.key} – ${range.to.key}` : 'Whole Quran';
}
