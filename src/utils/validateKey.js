/* eslint-disable no-case-declarations */
import { get } from 'svelte/store';
import { __currentPage, __chapterNumber } from '$utils/stores';
import { quranMetaData, supplicationsFromQuran } from '$data/quranMeta';
import { cdnStaticDataUrls } from '$data/websiteSettings';
import { fetchAndCacheJson } from '$utils/fetchData';

// Validates the search terms provided in the Quran navigation modal and returns structured results
export async function validateKey(key) {
	let results = {};

	if (isNumeric(key)) {
		handleNumericKey(key, results); // Processes numeric search terms
	} else if (isSpecialCharKey(key)) {
		await handleSpecialCharKey(key, results); // Processes search terms containing special characters
	} else {
		await handleStringKey(key, results); // Processes string search terms
	}

	// Check for supplications from Quran
	if (isSupplicationKey(key)) results.supplications = isSupplicationKey(key);

	if (results.chapters && Object.keys(results.chapters).length === 0) {
		delete results.chapters; // Removes empty chapters key if no chapters found
	}

	return Object.keys(results).length ? results : false; // Returns results or false if empty
}

// Processes numeric search terms and maps them to corresponding results
function handleNumericKey(key, results) {
	if (key >= 1 && key <= 114) results.chapter = key; // Maps key to chapter if valid
	if (get(__currentPage) === 'chapter' && key >= 1 && key <= quranMetaData[get(__chapterNumber)].verses) {
		results.verse = key; // Maps key to verse if current page is chapter and key is valid
	}
	if (key >= 1 && key <= 604) results.page = key; // Maps key to page if valid
	if (key >= 1 && key <= 30) results.juz = key; // Maps key to juz if valid
}

// Checks if the search term contains special characters (e.g., colon, dash, dot)
function isSpecialCharKey(key) {
	return [':', '-', '.'].some((char) => key.includes(char));
}

// Processes search terms containing special characters and maps them to corresponding results
async function handleSpecialCharKey(key, results) {
	const modifiedKey = key.replace(/[-.]/g, ':'); // Normalizes key to use colon as delimiter
	if (isValidVerseKey(modifiedKey)) results.key = modifiedKey; // Validates and maps to verse key
	if (await isValidWordKey(modifiedKey)) results.word = modifiedKey; // Validates and maps to word key
}

// Processes string search terms by splitting and validating them, mapping to results accordingly
async function handleStringKey(key, results) {
	const keySplit = key.split(' ');

	if (keySplit.length === 2 && isValidVerseKey(formatVerseKey(keySplit))) {
		results.key = formatVerseKey(keySplit); // Formats and validates as verse key
	} else if (keySplit.length === 3 && (await isValidWordKey(formatWordKey(keySplit)))) {
		results.word = formatWordKey(keySplit); // Formats and validates as word key
	} else if (key.length > 2) {
		results.chapters = findChapters(key); // Finds chapters matching the search term
	}
}

// Formats key split into a valid verse key (chapter:verse)
function formatVerseKey(keySplit) {
	return `${+keySplit[0]}:${+keySplit[1]}`;
}

// Formats key split into a valid word key (chapter:verse:word)
function formatWordKey(keySplit) {
	return `${+keySplit[0]}:${+keySplit[1]}:${+keySplit[2]}`;
}

// Searches for chapters based on the search term, matching against various metadata fields
function findChapters(key) {
	let chapters = {};

	for (let chapter = 1; chapter <= 114; chapter++) {
		const { arabic, transliteration, translation, alternateNames = [] } = quranMetaData[chapter];
		if ([arabic, transliteration, translation, ...alternateNames].some((term) => term.toLowerCase().includes(key.toLowerCase()))) {
			chapters[chapter] = { transliteration, translation }; // Adds matching chapters to results
		}
	}

	return chapters;
}

// Validates a verse key in the format (chapter:verse) to ensure it follows the expected structure
export function isValidVerseKey(key) {
	if (hasWhitespace(key) || !isNonEmptyString(key) || !containsOnlyTwoParts(key)) return false;

	const [chapter, verse] = key.split(':').map(Number);
	return isValidChapter(chapter) && isValidVerse(chapter, verse); // Validates chapter and verse numbers
}

// Validates a word key in the format (chapter:verse:word) to ensure it follows the expected structure
export async function isValidWordKey(key) {
	if (hasWhitespace(key) || !isNonEmptyString(key) || !containsOnlyThreeParts(key)) return false;

	const [chapter, verse, word] = key.split(':').map(Number);
	if (!isValidChapter(chapter) || !isValidVerse(chapter, verse)) return false;

	const verseKey = `${chapter}:${verse}`;
	const data = await fetchAndCacheJson(cdnStaticDataUrls.verseKeyData, 'other');

	return word >= 1 && word <= data[verseKey].words; // Validates word number within verse
}

// Checks if the key contains whitespace
function hasWhitespace(key) {
	return key.includes(' ');
}

// Checks if the key is a non-empty string
function isNonEmptyString(key) {
	return key !== null && key !== undefined && key !== '';
}

// Ensures the key contains exactly two parts (chapter:verse)
function containsOnlyTwoParts(key) {
	return key.split(':').length === 2;
}

// Ensures the key contains exactly three parts (chapter:verse:word)
function containsOnlyThreeParts(key) {
	return key.split(':').length === 3;
}

// Validates if the chapter number is within the valid range
function isValidChapter(chapter) {
	return chapter >= 1 && chapter <= 114;
}

// Validates if the verse number is within the valid range for the given chapter
function isValidVerse(chapter, verse) {
	return verse >= 1 && verse <= quranMetaData[chapter].verses;
}

// Checks if a value is numeric
function isNumeric(value) {
	return /^-?\d+$/.test(value);
}

// Function to detect if a provided key is included in supplicationsFromQuran
function isSupplicationKey(key) {
	// Normalize key to use colons as delimiters
	const normalizedKey = key.replace(/[-. ]/g, ':');

	if (Object.prototype.hasOwnProperty.call(supplicationsFromQuran, normalizedKey)) {
		return normalizedKey;
	}
}
