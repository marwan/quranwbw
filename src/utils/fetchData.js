import { db } from '$lib/db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { apiEndpoint, staticEndpoint, translationsDataEndpoint, apiVersion, apiByPassCache } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';

// Fetch specific verses (startVerse to endVerse) and cache chapter data
export async function fetchChapterData(props) {
	if (!props.skipSave) __chapterData.set(null);

	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	// Generate a unique key for the data
	const cacheKey = `${props.chapter}_${selectableFontTypes[fontType].apiId}_${wordTranslation}_${wordTransliteration}_${apiVersion}`;

	// Try to load from cache
	const cachedData = await useCache(cacheKey, 'chapter');

	if (cachedData) {
		if (!props.skipSave) __chapterData.set(cachedData);
		return cachedData;
	}

	// Build API URL
	const apiURL =
		`${apiEndpoint}/chapter?` +
		new URLSearchParams({
			chapter: props.chapter,
			word_type: selectableFontTypes[fontType].apiId,
			word_translation: wordTranslation,
			word_transliteration: wordTransliteration,
			version: apiVersion,
			bypass_cache: apiByPassCache
		});

	// Fetch from API
	const response = await fetch(apiURL);
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save to cache
	await useCache(cacheKey, 'chapter', data.data.verses);

	// Update store
	if (!props.skipSave) __chapterData.set(data.data.verses);

	return data.data.verses;
}

export async function fetchVerseTranslationData(props) {
	// Use translation IDs from props or fallback to store
	if (!props.translations) props.translations = get(__verseTranslations);

	// Get current store data
	const existingData = get(__verseTranslationData) || {};

	// Final object to hold the complete data
	const updatedData = { ...existingData };

	// Filter translation IDs that need to be fetched (not in store or cache)
	const idsToFetch = [];

	for (const id of props.translations) {
		// Try to load from cache first
		const cacheKey = `translation_${id}`;
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
		if (!props.skipSave) __verseTranslationData.set(updatedData);

		return updatedData;
	}

	// Fetch missing translations
	const fetchPromises = idsToFetch.map(async (id) => {
		const url = `${translationsDataEndpoint}/translations/translation_${id}.json?v=112`;
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to fetch translation ID ${id}`);
			const data = await res.json();

			// Save to cache
			await useCache(`translation_${id}`, 'translation', data);

			return { id, data };
		} catch (err) {
			console.error(`Error fetching translation ${id}:`, err);
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
	if (!props.skipSave) __verseTranslationData.set(updatedData);

	return updatedData;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}

// Unified cache utility function for IndexedDB with timestamp validation
async function useCache(key, type, dataToSet = undefined) {
	try {
		// Select the correct table based on the type
		const table = type === 'chapter' ? db.chapter_data : db.translation_data;

		if (!table) throw new Error(`Invalid table for type: ${type}`);

		if (dataToSet !== undefined) {
			// Store data along with a timestamp (in milliseconds)
			await table.put({
				key,
				data: dataToSet,
				timestamp: Date.now()
			});
			return true;
		} else {
			// Attempt to get the cached record
			const record = await table.get(key);

			if (!record) return null;

			const isFresh = Date.now() - record.timestamp < 7 * 24 * 60 * 60 * 1000; // 7 days

			if (isFresh) {
				return record.data;
			} else {
				// Data is stale: delete it and return null to trigger fresh fetch
				await table.delete(key);
				return null;
			}
		}
	} catch (error) {
		console.error('IndexedDB cache error:', error);
		return dataToSet !== undefined ? false : null;
	}
}
