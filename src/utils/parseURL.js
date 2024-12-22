import { get } from 'svelte/store';
import { __chapterNumber } from '$utils/stores';
import { quranMetaData } from '$data/quranMeta';

// Function to parse the URL to get the starting and ending verses
// Supported URL patterns:
// /<chapter> (e.g., /1)
// /<chapter>/<verse> (e.g., /2/255)
// /<chapter>:<verse> (e.g., /2:255)
// /<chapter>#<verse> (e.g., /2#255)
// /<chapter>/<verse>-<endVerse> (e.g., /2/285-286)
// /<chapter>-<verse> (e.g., /2-255)
// /<chapter>.<verse> (e.g., /2.255)
export function parseURL() {
	const chapterTotalVerses = quranMetaData[get(__chapterNumber)].verses;
	const url = window.location.pathname;
	const hash = window.location.hash.slice(1); // Get the hash part of the URL
	let startVerse, endVerse;

	// Remove any leading slash and split the URL by '/', '-', ':', or '.'
	const urlParts = url.replace(/^\/+/, '').split(/[-/:.]/);

	// for URLs with only chapter number or chapter and verses
	if (urlParts.length >= 1) {
		const chapter = parseInt(urlParts[0], 10) || 1;

		// limit chapter to valid range
		if (chapter < 1 || chapter > 114) {
			startVerse = 1;
			endVerse = chapterTotalVerses;
		} else if (urlParts.length === 1) {
			startVerse = 1;
			endVerse = quranMetaData[chapter].verses;
		} else {
			const verseRange = urlParts[1].split('-');
			startVerse = parseInt(verseRange[0], 10) || 1;
			endVerse = parseInt(verseRange[1], 10) || startVerse;

			// Ensure start verse is between 1 and the max number of verses
			startVerse = Math.max(1, Math.min(startVerse, quranMetaData[chapter].verses));

			// Ensure end verse is between start verse and max verses
			endVerse = Math.max(startVerse, Math.min(endVerse, quranMetaData[chapter].verses));
		}
	}

	// check for hash-based verse
	if (hash) {
		const hashVerse = parseInt(hash, 10);
		if (!isNaN(hashVerse)) {
			startVerse = hashVerse;
			endVerse = hashVerse;

			// limit hash-based verse to valid range
			const chapter = parseInt(urlParts[0], 10) || 1;
			startVerse = Math.max(1, Math.min(startVerse, quranMetaData[chapter].verses));
			endVerse = Math.max(startVerse, Math.min(endVerse, quranMetaData[chapter].verses));
		}
	}

	// fallback for URLs without valid verses or chapters
	if (!startVerse || !endVerse) {
		startVerse = 1;
		endVerse = chapterTotalVerses;
	}

	return [startVerse, endVerse];
}
