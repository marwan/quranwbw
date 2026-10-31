import { get } from 'svelte/store';
import { __chapterNumber } from '$utils/stores';
import { quranMetaData } from '$data/quranMeta';

// Characters that can separate chapter/verse and verse/endVerse
const separators = /[#.:-]/;

// Max verses shown when the URL doesn't define an explicit range
const maxDefaultRange = 5;

// Keep a number within [min, max]
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// Function to parse the URL to get the starting and ending verses
// Supported URL patterns:
// /<chapter> (e.g., /1)
// /<chapter>/<verse> (e.g., /2/255)
// /<chapter>:<verse> (e.g., /2:255)
// /<chapter>#<verse> (e.g., /2#255)
// /<chapter>/<verse>-<endVerse> (e.g., /2/285-286)
// /<chapter>-<verse> (e.g., /2-255)
// /<chapter>.<verse> (e.g., /2.255)
// /<chapter>-<verse>-<endVerse> (e.g., /2-255-260), also works with : and .
// And ?startVerse=<verse>
// Priority (lowest to highest): path verse(s) < ?startVerse < #hash
export function parseURL() {
	// Verse count of the currently selected chapter, used as a fallback
	const fallbackTotalVerses = quranMetaData[get(__chapterNumber)].verses;

	const hash = window.location.hash.slice(1);
	const queryParams = new URLSearchParams(window.location.search);
	const startVerseParam = parseInt(queryParams.get('startVerse'), 10);

	// Split by '/' only, the first part holds the chapter (and maybe the verse)
	const pathParts = window.location.pathname.replace(/^\/+/, '').split('/');
	const chapter = parseInt(pathParts[0], 10) || 1;

	// Unknown chapter (e.g., 0 or 200): fall back to the default window of the current chapter
	const chapterData = quranMetaData[chapter];
	if (!chapterData) {
		return [1, Math.min(fallbackTotalVerses, maxDefaultRange)];
	}

	const totalVerses = chapterData.verses;

	// Defaults: whole chapter (capped at the end)
	let startVerse = 1;
	let endVerse = totalVerses;
	let wasExplicitRange = false;

	// Verse tokens can come from the first part ("2:255", "2-255-260") or the second part ("255-260")
	let verseTokens = null;
	const firstPartTokens = pathParts[0].split(separators).slice(1);

	if (firstPartTokens.length > 0) {
		verseTokens = firstPartTokens;
	} else if (pathParts.length >= 2) {
		verseTokens = pathParts[1].split(separators);
	}

	if (verseTokens) {
		// Invalid or missing start verse falls back to verse 1
		startVerse = parseInt(verseTokens[0], 10) || 1;
		endVerse = parseInt(verseTokens[1], 10);

		if (!isNaN(endVerse)) {
			// An end verse in the URL means the user asked for a range
			wasExplicitRange = true;
		} else {
			// No end verse, show a single verse
			endVerse = startVerse;
		}

		startVerse = clamp(startVerse, 1, totalVerses);
		endVerse = clamp(endVerse, startVerse, totalVerses);
	}

	// Override with ?startVerse param
	if (!isNaN(startVerseParam)) {
		startVerse = clamp(startVerseParam, 1, totalVerses);
		endVerse = startVerse;
		wasExplicitRange = false;
	}

	// Override with hash
	if (hash) {
		const hashVerse = parseInt(hash, 10);
		if (!isNaN(hashVerse)) {
			startVerse = clamp(hashVerse, 1, totalVerses);
			endVerse = startVerse;
			wasExplicitRange = false;
		}
	}

	// Enforce max range of 5 verses (unless explicitly defined in URL)
	if (!wasExplicitRange && endVerse - startVerse > maxDefaultRange - 1) {
		endVerse = Math.min(startVerse + maxDefaultRange - 1, totalVerses);
	}

	return [startVerse, endVerse];
}
