import { db } from '$utils/db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { staticEndpoint, apiVersion } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';

// Fetches and combines word-by-word data for a chapter including Arabic, translation, transliteration, and metadata
export async function fetchChapterData(props) {
	if (!props.preventStoreUpdate) __chapterData.set(null);

	const chapter = Number(props.chapter);
	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	const { arabicWordData, translationWordData, transliterationWordData, metaVerseData } = await fetchWordData(
		// arabic data
		selectableFontTypes[fontType].apiId,
		// translation data
		wordTranslation,
		// transliteration data
		wordTransliteration
	);

	const result = {};
	const arabicVerses = arabicWordData[chapter] || {};
	const translationVerses = translationWordData[chapter] || {};
	const transliterationVerses = transliterationWordData[chapter] || {};

	for (const verseStr in arabicVerses) {
		const verseKey = `${chapter}:${verseStr}`;

		const [arabicWords = [], lineNumbers = [], endIcons = []] = arabicVerses[verseStr];
		const translations = (translationVerses[verseStr] && translationVerses[verseStr][0]) || [];
		const transliterations = (transliterationVerses[verseStr] && transliterationVerses[verseStr][0]) || [];
		const meta = metaVerseData[verseKey] || {
			chapter: chapter,
			verse: parseInt(verseStr, 10),
			page: null,
			juz: null,
			words: arabicWords.length
		};

		result[verseKey] = {
			meta: {
				chapter: chapter,
				verse: parseInt(verseStr, 10),
				page: meta.page,
				juz: meta.juz,
				words: meta.words
			},
			words: {
				arabic: arabicWords,
				translation: translations,
				transliteration: transliterations,
				line: lineNumbers,
				end: endIcons[0] || ''
			}
		};
	}

	// Update store
	if (!props.preventStoreUpdate) __chapterData.set(result);

	return result;
}

// Fetch specific translations and cache the data
export async function fetchVerseTranslationData(props) {
	const translations = get(__verseTranslations);

	// Get current store data
	const existingData = get(__verseTranslationData) || {};

	// Final object to hold the complete data
	const updatedData = { ...existingData };

	// Filter translation IDs that need to be fetched (not in store or cache)
	const idsToFetch = [];

	for (const id of translations) {
		// Try to load from cache first
		const cacheKey = `translation_${id}_${apiVersion}`;
		const cached = await useCache(cacheKey, 'translation');

		if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
			updatedData[id] = cached;
		} else {
			idsToFetch.push(id);
		}
	}

	// Early return if everything was found in cache/store
	if (idsToFetch.length === 0) {
		// Update the store
		if (!props.preventStoreUpdate) __verseTranslationData.set(updatedData);

		return updatedData;
	}

	// Fetch missing translations
	const fetchPromises = idsToFetch.map(async (id) => {
		const url = `${staticEndpoint}/translations/data/translation_${id}.json?v=${apiVersion}`;
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to fetch translation ID ${id}`);
			const data = await res.json();

			// Save to cache
			await useCache(`translation_${id}_${apiVersion}`, 'translation', data);

			return { id, data };
		} catch (error) {
			console.warn(`Error fetching translation ${id}:`, error);
			return { id, data: null };
		}
	});

	const results = await Promise.all(fetchPromises);

	// Merge fetched data into final object
	for (const { id, data } of results) {
		if (data) {
			updatedData[id] = data;
		}
	}

	// Update the store
	if (!props.preventStoreUpdate) __verseTranslationData.set(updatedData);

	return updatedData;
}

// Generic fetch and cache utility
export async function fetchAndCacheJson(url, type = 'other') {
	// Generate a unique key for the data
	const parsedUrl = new URL(url);
	const pathParts = parsedUrl.pathname.split('/').filter(Boolean); // removes empty strings
	const lastPart = pathParts[pathParts.length - 1] || '';
	const secondLastPart = pathParts[pathParts.length - 2] || 'root'; // fallback if not present
	const cacheKey = `${secondLastPart}/${lastPart}${parsedUrl.search}`;

	// Try to load from cache
	const cachedData = await useCache(cacheKey, type);
	if (cachedData) {
		return cachedData;
	}

	// Fetch from API
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save to cache
	await useCache(cacheKey, type, data);

	return data;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}

// Fetches all word data and returns 4 random words with their Arabic, transliteration, and translation
export async function fetchRandomWords() {
	const { arabicWordData, translationWordData, transliterationWordData } = await fetchWordData(1, 1, 1);

	const allWordEntries = [];

	for (const chapter in arabicWordData) {
		const verses = arabicWordData[chapter];
		for (const verse in verses) {
			const [arabicWords = []] = verses[verse];
			const translations = translationWordData[chapter]?.[verse]?.[0] || [];
			const transliterations = transliterationWordData[chapter]?.[verse]?.[0] || [];

			for (let i = 0; i < arabicWords.length; i++) {
				allWordEntries.push({
					word_key: `${chapter}:${verse}:${i + 1}`,
					word_arabic: arabicWords[i],
					word_transliteration: transliterations[i] || '',
					word_english: translations[i] || ''
				});
			}
		}
	}

	// Shuffle and pick 4 random unique words
	const shuffled = allWordEntries.sort(() => 0.5 - Math.random());
	const selected = shuffled.slice(0, 4);

	return selected;
}

// Unified cache utility for IndexedDB with version and freshness control
async function useCache(key, type, dataToSet = undefined) {
	try {
		// Select the appropriate table based on the type
		let table;

		switch (type) {
			case 'chapter':
				table = db.chapter_data;
				break;
			case 'translation':
				table = db.translation_data;
				break;
			case 'morphology':
				table = db.morphology_data;
				break;
			case 'tafsir':
				table = db.tafsir_data;
				break;
			case 'other':
				table = db.other_data;
				break;
			default:
				throw new Error(`Invalid table for type: ${type}`);
		}

		if (!table) throw new Error(`Table not found for type: ${type}`);

		// Access the version table to verify current API version
		const versionTable = db.data_version;
		const versionRecord = await versionTable.get('version');
		const storedVersion = versionRecord?.value;

		// If no version exists or it doesn't match the current version,
		// clear both caches and update the stored version
		if (storedVersion !== apiVersion) {
			await Promise.all([db.chapter_data.clear(), db.translation_data.clear(), versionTable.put({ key: 'version', value: apiVersion })]);
		}

		if (dataToSet !== undefined) {
			// Set data in the cache with current timestamp
			await table.put({
				key,
				data: dataToSet,
				timestamp: Date.now()
			});
			return true;
		} else {
			// Attempt to retrieve cached data
			const record = await table.get(key);
			if (!record) return null;

			// Check if the cached data is fresh (within 7 days)
			const isFresh = Date.now() - record.timestamp < 7 * 24 * 60 * 60 * 1000;
			if (isFresh) {
				return record.data;
			} else {
				// If stale, delete it and return null to trigger a fresh fetch
				await table.delete(key);
				return null;
			}
		}
	} catch (error) {
		// Log any unexpected errors and return appropriate fallback
		console.warn('IndexedDB cache error:', error?.message || error);
		return dataToSet !== undefined ? false : null;
	}
}

// Fetches Arabic, translation, transliteration, and meta verse data in parallel
async function fetchWordData(fontType, wordTranslation, wordTransliteration) {
	const [arabicWordData, translationWordData, transliterationWordData, metaVerseData] = await Promise.all([
		fetchAndCacheJson(`${staticEndpoint}/words-data/arabic/${fontType}.json?version=3`, 'chapter'),
		fetchAndCacheJson(`${staticEndpoint}/words-data/translations/${wordTranslation}.json?version=3`, 'chapter'),
		fetchAndCacheJson(`${staticEndpoint}/words-data/transliterations/${wordTransliteration}.json?version=3`, 'chapter'),
		fetchAndCacheJson(`${staticEndpoint}/meta/verseKeyData.json?version=2`, 'other')
	]);

	return {
		arabicWordData,
		translationWordData,
		transliterationWordData,
		metaVerseData
	};
}
