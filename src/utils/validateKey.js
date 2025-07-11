/* eslint-disable no-case-declarations */
import { quranMetaData, supplicationsFromQuran } from '$data/quranMeta';
import { staticEndpoint } from '$data/websiteSettings';
import { fetchAndCacheJson } from '$utils/fetchData';

// Main validation function that processes search input and returns structured results
export async function validateSearchInput(input) {
	let results = {};

	// Check for chapter (1-114)
	const chapterNum = detectChapter(input);
	if (chapterNum) {
		// Convert single chapter to chapters object format
		const { transliteration, translation } = quranMetaData[chapterNum];
		results.chapters = { [chapterNum]: { transliteration, translation } };
	}

	// Check for page (1-604)
	const pageNum = detectPage(input);
	if (pageNum) results.page = pageNum;

	// Check for juz (1-30)
	const juzNum = detectJuz(input);
	if (juzNum) results.juz = juzNum;

	// Check for verse key (e.g., 1:1, 1-1, 1.1)
	const verseKey = isValidVerseKey(input);
	if (verseKey) results.key = verseKey;

	// Check for word key (e.g., 1:1:1, 1-1-1, 1.1.1)
	const wordKey = await isValidWordKey(input);
	if (wordKey) results.word = wordKey;

	// Check for supplications
	const supplicationKey = detectSupplication(input);
	if (supplicationKey) results.supplications = supplicationKey;

	// Check for chapter name search (only if input is string with more than 2 characters)
	if (!isNumeric(input) && input.length > 2) {
		const chapters = findChapters(input);
		if (Object.keys(chapters).length > 0) {
			results.chapters = chapters;
		}
	}

	// Return results or false if empty
	const finalResults = Object.keys(results).length ? results : false;
	console.log(finalResults);
	return finalResults;
}

// Detects if input is a valid chapter number (1-114)
function detectChapter(input) {
	if (!isNumeric(input)) return false;
	const num = parseInt(input, 10);
	return isValidChapter(num) ? num : false;
}

// Detects if input is a valid page number (1-604)
function detectPage(input) {
	if (!isNumeric(input)) return false;
	const num = parseInt(input, 10);
	return isValidPage(num) ? num : false;
}

// Detects if input is a valid juz number (1-30)
function detectJuz(input) {
	if (!isNumeric(input)) return false;
	const num = parseInt(input, 10);
	return isValidJuz(num) ? num : false;
}

// Detects if input is a valid supplication key
function detectSupplication(input) {
	const normalizedInput = normalizeDelimiters(input);
	return Object.prototype.hasOwnProperty.call(supplicationsFromQuran, normalizedInput) ? normalizedInput : false;
}

// Normalizes delimiters (-, ., space) to colon format
function normalizeDelimiters(input) {
	return input.replace(/[-. ]/g, ':');
}

// Validates verse key format and constraints (with detection logic built-in)
export function isValidVerseKey(input) {
	// Handle special characters and normalize to colon format
	const normalizedInput = normalizeDelimiters(input);

	let key = normalizedInput;

	// Check for verse key format (two parts separated by colon)
	if (!normalizedInput.includes(':') || normalizedInput.split(':').length !== 2) {
		// Also check for space-separated format (e.g., "1 1")
		const parts = input.trim().split(' ');
		if (parts.length === 2 && isNumeric(parts[0]) && isNumeric(parts[1])) {
			key = `${parseInt(parts[0], 10)}:${parseInt(parts[1], 10)}`;
		} else {
			return false;
		}
	}

	// Validate the key format
	if (hasWhitespace(key) || !isNonEmptyString(key) || key.split(':').length !== 2) {
		return false;
	}

	const [chapter, verse] = key.split(':').map(Number);
	const isValid = isValidChapter(chapter) && isValidVerse(chapter, verse);

	return isValid ? key : false;
}

// Validates word key format and constraints (with detection logic built-in)
export async function isValidWordKey(input) {
	// Handle special characters and normalize to colon format
	const normalizedInput = normalizeDelimiters(input);

	let key = normalizedInput;

	// Check for word key format (three parts separated by colon)
	if (!normalizedInput.includes(':') || normalizedInput.split(':').length !== 3) {
		// Also check for space-separated format (e.g., "1 1 1")
		const parts = input.trim().split(' ');
		if (parts.length === 3 && isNumeric(parts[0]) && isNumeric(parts[1]) && isNumeric(parts[2])) {
			key = `${parseInt(parts[0], 10)}:${parseInt(parts[1], 10)}:${parseInt(parts[2], 10)}`;
		} else {
			return false;
		}
	}

	// Validate the key format
	if (hasWhitespace(key) || !isNonEmptyString(key) || key.split(':').length !== 3) {
		return false;
	}

	const [chapter, verse, word] = key.split(':').map(Number);
	if (!isValidChapter(chapter) || !isValidVerse(chapter, verse)) {
		return false;
	}

	const verseKey = `${chapter}:${verse}`;
	const data = await fetchAndCacheJson(`${staticEndpoint}/meta/verseKeyData.json?version=2`, 'other');

	const isValid = word >= 1 && word <= data[verseKey].words;

	return isValid ? key : false;
}

// Validates chapter number (1-114)
function isValidChapter(chapter) {
	return chapter >= 1 && chapter <= 114;
}

// Validates page number (1-604)
function isValidPage(page) {
	return page >= 1 && page <= 604;
}

// Validates juz number (1-30)
function isValidJuz(juz) {
	return juz >= 1 && juz <= 30;
}

// Validates verse number within chapter
function isValidVerse(chapter, verse) {
	return verse >= 1 && verse <= quranMetaData[chapter].verses;
}

// Searches for chapters based on name, translation, transliteration, etc.
function findChapters(searchTerm) {
	let chapters = {};

	for (let chapter = 1; chapter <= 114; chapter++) {
		const { arabic, transliteration, translation, alternateNames = [] } = quranMetaData[chapter];
		const searchFields = [arabic, transliteration, translation, ...alternateNames];

		if (searchFields.some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))) {
			chapters[chapter] = { transliteration, translation };
		}
	}

	return chapters;
}

// Helper functions
function isNumeric(value) {
	return /^-?\d+$/.test(value);
}

function hasWhitespace(key) {
	return key.includes(' ');
}

function isNonEmptyString(key) {
	return key !== null && key !== undefined && key !== '';
}
