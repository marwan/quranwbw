import { cacheTableMap } from '$utils/dexie';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations } from '$utils/stores';
import { staticEndpoint } from '$data/websiteSettings';
import { selectableFontTypes, selectableWordTranslations, selectableWordTransliterations, selectableVerseTranslations } from '$data/options';

// Keep track of in-progress fetches globally
const inFlightRequests = new Map();

// Fetches and combines word-by-word data for a chapter including Arabic, translation, transliteration, and metadata
export async function fetchChapterData(props) {
	if (!props.preventStoreUpdate) __chapterData.set(null);

	const chapter = Number(props.chapter);
	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	const { arabicWordData, translationWordData, transliterationWordData, metaVerseData } = await fetchWordData(fontType, wordTranslation, wordTransliteration);

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
		const version = selectableVerseTranslations[id].version;
		const cached = await fetchAndCacheJson(`${staticEndpoint}/verse-translations/${id}.json?version=${version}`, 'translation');

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
		const version = selectableVerseTranslations[id].version;
		try {
			const res = await fetchAndCacheJson(`${staticEndpoint}/verse-translations/${id}.json?version=${version}`, 'translation');

			if (!res.ok) throw new Error(`Failed to fetch translation ID ${id}`);
			const data = await res.json();

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

// Generic fetch and cache utility with safe 7-day expiry logic
export async function fetchAndCacheJson(url, type = 'other') {
	const parsedUrl = new URL(url);
	const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
	const lastPart = pathParts[pathParts.length - 1] || '';
	const secondLastPart = pathParts[pathParts.length - 2] || 'root';
	const cacheKey = `${secondLastPart}/${lastPart}${parsedUrl.search}`;
	const maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days

	// 1. Try cache first
	const cachedData = await manageCache(cacheKey, type);

	if (cachedData) {
		const hasValidTimestamp = typeof cachedData.timestamp === 'number' && !isNaN(cachedData.timestamp);
		const age = hasValidTimestamp ? Date.now() - cachedData.timestamp : Infinity;

		// If stale → kick off background fetch (deduplicated)
		if (age > maxCacheAge && !inFlightRequests.has(cacheKey)) {
			inFlightRequests.set(
				cacheKey,
				(async () => {
					try {
						const response = await fetch(url);
						if (!response.ok) throw new Error('CDN response not ok');
						const freshData = await response.json();
						await manageCache(cacheKey, type, freshData);
						console.log(`[cache] background update done for ${cacheKey}`);
						return freshData;
					} catch (err) {
						console.warn(`[cache] background update failed for ${cacheKey}:`, err);
					} finally {
						inFlightRequests.delete(cacheKey);
					}
				})()
			);
		}

		// Always return stale (or fresh) cache immediately
		return cachedData.data;
	}

	// 2. No cache → see if someone else is already fetching
	if (inFlightRequests.has(cacheKey)) {
		return inFlightRequests.get(cacheKey);
	}

	// 3. Otherwise start a new fetch and store the Promise
	const fetchPromise = (async () => {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch data from the CDN');
			const data = await response.json();
			await manageCache(cacheKey, type, data);
			return data;
		} finally {
			inFlightRequests.delete(cacheKey);
		}
	})();

	inFlightRequests.set(cacheKey, fetchPromise);

	return fetchPromise;
}

// Unified cache utility for IndexedDB with version and freshness control
async function manageCache(key, type, dataToSet = undefined) {
	try {
		const table = cacheTableMap[type];
		if (!table) throw new Error(`Invalid table for type: ${type}`);

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
			return record;
		}
	} catch (error) {
		// Log any unexpected errors and return appropriate fallback
		console.warn('IndexedDB cache error:', error?.message || error);
		return dataToSet !== undefined ? false : null;
	}
}

// Fetches Arabic, translation, transliteration, and meta verse data in parallel
export async function fetchWordData(fontType, wordTranslation, wordTransliteration) {
	const { id: fontID, version: arabicVersion } = selectableFontTypes[fontType];
	const { version: translationVersion } = selectableWordTranslations[wordTranslation];
	const { version: transliterationVersion } = selectableWordTransliterations[wordTransliteration];

	const urls = [
		{ url: `${staticEndpoint}/words-data/arabic/${fontID}.json?version=${arabicVersion}`, type: 'word' },
		{ url: `${staticEndpoint}/words-data/translations/${wordTranslation}.json?version=${translationVersion}`, type: 'word' },
		{ url: `${staticEndpoint}/words-data/transliterations/${wordTransliteration}.json?version=${transliterationVersion}`, type: 'word' },
		{ url: `${staticEndpoint}/meta/verseKeyData.json?version=2`, type: 'other' }
	];

	const [arabicWordData, translationWordData, transliterationWordData, metaVerseData] = await Promise.all(urls.map(({ url, type }) => fetchAndCacheJson(url, type)));

	return {
		arabicWordData,
		translationWordData,
		transliterationWordData,
		metaVerseData
	};
}
