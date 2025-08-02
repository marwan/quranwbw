import { updateSettings } from '$utils/updateSettings';
import { quranMetaData } from '$data/quranMeta';
import { cacheTableMap } from '$utils/dexie';

// Set of functions for testing/debugging certain features
class devTools {
	constructor() {
		if (typeof window !== 'undefined') {
			window.BookmarkAndNotesManager = this;
		}
	}

	generateRandomText(wordCount) {
		const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'Ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi'];
		let text = '';
		for (let i = 0; i < wordCount; i++) {
			text += words[Math.floor(Math.random() * words.length)] + ' ';
		}
		return text.trim();
	}

	addRandomBookmarks(count) {
		for (let i = 0; i < count; i++) {
			// Generate a random chapter number between 1 and 114
			let chapterNumber = Math.floor(Math.random() * 114) + 1;

			// Get the maximum number of verses in the selected chapter
			let maxVerses = quranMetaData[chapterNumber].verses;

			// Generate a random verse number between 1 and maxVerses
			let verseNumber = Math.floor(Math.random() * maxVerses) + 1;

			// Create the key in the format chapter:verse
			let key = `${chapterNumber}:${verseNumber}`;

			// Add the key as a bookmark
			updateSettings({ type: 'userBookmarks', key: key, set: true });
		}
	}

	addRandomNotes(count) {
		for (let i = 0; i < count; i++) {
			// Generate a random chapter number between 1 and 114
			let chapterNumber = Math.floor(Math.random() * 114) + 1;

			// Get the maximum number of verses in the selected chapter
			let maxVerses = quranMetaData[chapterNumber].verses;

			// Generate a random verse number between 1 and maxVerses
			let verseNumber = Math.floor(Math.random() * maxVerses) + 1;

			// Create the key in the format chapter:verse
			let key = `${chapterNumber}:${verseNumber}`;

			// Generate a random text of 20-30 words
			let notesValue = this.generateRandomText(Math.floor(Math.random() * 11) + 20);

			// Add the key and value as a note
			updateSettings({ type: 'userNotes', key: key, value: notesValue, set: true });
		}
	}

	deleteBookmarks() {
		updateSettings({ type: 'userBookmarks', key: [], override: true });
	}

	deleteNotes() {
		updateSettings({ type: 'userNotes', key: {}, override: true });
	}

	// Simulate stale cache records by setting their timestamps to over 7 days ago
	async markRandomCacheStale() {
		const maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days
		const tableKeys = Object.keys(cacheTableMap);
		const numTablesToTouch = Math.floor(Math.random() * tableKeys.length) + 1;

		const randomTables = tableKeys.sort(() => 0.5 - Math.random()).slice(0, numTablesToTouch);

		for (const type of randomTables) {
			const table = cacheTableMap[type];

			const allKeys = await table.toCollection().primaryKeys();
			if (allKeys.length === 0) continue;

			const numRecordsToUpdate = Math.max(1, Math.floor(allKeys.length * 0.8)); // 80% or at least 1
			const randomKeys = allKeys.sort(() => 0.5 - Math.random()).slice(0, numRecordsToUpdate);

			await Promise.all(
				randomKeys.map(async (key) => {
					const record = await table.get(key);
					if (record) {
						await table.put({
							...record,
							timestamp: maxCacheAge
						});
					}
				})
			);
		}

		console.log('Some cache records marked as stale.');
	}
}

// Instantiate the class to make it globally available, but only if localhost
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '') {
	window.devTools = new devTools();
}
