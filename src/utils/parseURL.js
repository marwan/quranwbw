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
// And now supports URL parameter ?startVerse=<verse>
export function parseURL() {
	const chapterTotalVerses = quranMetaData[get(__chapterNumber)].verses;
	const url = window.location.pathname;
	const hash = window.location.hash.slice(1);
	const queryParams = new URLSearchParams(window.location.search);
	const startVerseParam = parseInt(queryParams.get('startVerse'), 10);

	let startVerse, endVerse;
	let wasExplicitRange = false;

	// Split by '/' only
	const pathParts = url.replace(/^\/+/, '').split('/');
	const chapter = parseInt(pathParts[0], 10) || 1;

	if (chapter < 1 || chapter > 114) {
		startVerse = 1;
		endVerse = chapterTotalVerses;
	} else if (pathParts.length === 1) {
		startVerse = 1;
		endVerse = quranMetaData[chapter].verses;
	} else if (pathParts.length >= 2) {
		const secondPart = pathParts[1];

		let range = secondPart.split(/[-:.#]/);
		startVerse = parseInt(range[0], 10) || 1;
		endVerse = parseInt(range[1], 10);

		if (!isNaN(endVerse)) {
			wasExplicitRange = true;
		} else {
			endVerse = startVerse;
		}

		startVerse = Math.max(1, Math.min(startVerse, quranMetaData[chapter].verses));
		endVerse = Math.max(startVerse, Math.min(endVerse, quranMetaData[chapter].verses));
	}

	// Override with ?startVerse param
	if (!isNaN(startVerseParam)) {
		startVerse = Math.max(1, Math.min(startVerseParam, quranMetaData[chapter].verses));
		endVerse = startVerse;
		wasExplicitRange = false;
	}

	// Override with hash
	if (hash) {
		const hashVerse = parseInt(hash, 10);
		if (!isNaN(hashVerse)) {
			startVerse = Math.max(1, Math.min(hashVerse, quranMetaData[chapter].verses));
			endVerse = startVerse;
			wasExplicitRange = false;
		}
	}

	// Final fallback
	if (!startVerse || !endVerse) {
		startVerse = 1;
		endVerse = chapterTotalVerses;
	}

	// Enforce max range of 5 verses (unless explicitly defined in URL)
	if (!wasExplicitRange && endVerse - startVerse > 4) {
		endVerse = Math.min(startVerse + 4, quranMetaData[chapter].verses);
	}

	return [startVerse, endVerse];
}
