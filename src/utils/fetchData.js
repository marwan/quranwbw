import { db } from '$lib/db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { apiEndpoint, staticEndpoint, apiVersion, apiByPassCache } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';

const CACHE_EXPIRY_DAYS = 7; // Data will be considered stale after 7 days

// Fetch specific verses (startVerse to endVerse) and cache chapter data
export async function fetchChapterData(props) {
	if (!props.skipSave) __chapterData.set(null);

	// Determine font and translation preferences, falling back to defaults if not provided
	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	// Generate a unique key for caching the data, incorporating all relevant parameters
	const apiId = selectableFontTypes[fontType].apiId;
	const cacheKey = `${props.chapter}--${apiId}--${wordTranslation}--${wordTransliteration}`;

	// --- Cache Check and Invalidation Logic ---
	try {
		const cachedRecord = await db.chapter_data.get(cacheKey);

		if (cachedRecord && cachedRecord.data && cachedRecord.timestamp) {
			const now = Date.now();
			const ageInMilliseconds = now - cachedRecord.timestamp;
			const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);

			if (ageInDays > CACHE_EXPIRY_DAYS) {
				// Data is too old, delete it and proceed to fetch fresh data
				console.log(`Cached data for ${cacheKey} is stale (${ageInDays.toFixed(1)} days old). Deleting and refetching.`);
				await db.chapter_data.delete(cacheKey);
				// The function will now continue to the API fetch section below
			} else {
				// Data is fresh, return the cached data
				console.log(`Returning fresh cached data for ${cacheKey} (${ageInDays.toFixed(1)} days old).`);
				if (!props.skipSave) {
					__chapterData.set(cachedRecord.data);
				}
				return cachedRecord.data;
			}
		} else if (cachedRecord && cachedRecord.data && !cachedRecord.timestamp) {
			// If data exists but has no timestamp (e.g., from a previous version of the app),
			// treat it as stale to ensure future entries have timestamps.
			console.log(`Cached data for ${cacheKey} found without timestamp. Deleting and refetching.`);
			await db.chapter_data.delete(cacheKey);
		}
	} catch (error) {
		console.error('Error checking or invalidating cache:', error);
		// Continue to fetch from API if there's an error with IndexedDB access
	}
	// --- End Cache Check and Invalidation Logic ---

	// If data was not found in cache, or was stale, fetch from the API
	const apiURL =
		`${apiEndpoint}/chapter?` +
		new URLSearchParams({
			chapter: props.chapter,
			word_type: apiId,
			word_translation: wordTranslation,
			word_transliteration: wordTransliteration,
			version: apiVersion,
			bypass_cache: apiByPassCache
		});

	console.log(`Fetching data from API: ${apiURL}`);
	const response = await fetch(apiURL);
	if (!response.ok) {
		throw new Error(`Failed to fetch data from the API: ${response.statusText}`);
	}
	const data = await response.json();

	// Check if data.data and data.data.verses exist before trying to save
	if (!data || !data.data || !data.data.verses) {
		console.error('API response structure unexpected:', data);
		throw new Error('Invalid data structure received from API.');
	}

	// Save the fetched data to IndexedDB with the timestamp
	try {
		await db.chapter_data.put({ key: cacheKey, data: data.data.verses, timestamp: Date.now() });
		console.log(`Fetched data for ${cacheKey} saved to cache with timestamp.`);
	} catch (error) {
		console.error('Error saving data to IndexedDB:', error);
	}

	// Update the Svelte store if required
	if (!props.skipSave) {
		__chapterData.set(data.data.verses);
	}

	return data.data.verses;
}

export async function fetchVerseTranslationData(props) {
	// Use translation IDs from props or fallback to store
	if (!props.translations) props.translations = get(__verseTranslations);

	// Get current store data
	const existingData = get(__verseTranslationData) || {};

	// Figure out which IDs actually need fetching
	const idsToFetch = props.translations.filter((id) => {
		const data = existingData[id];
		// Check it's a non-null object with at least one key (i.e. valid JSON)
		return !data || typeof data !== 'object' || Object.keys(data).length === 0;
	});

	// Early return if everything is already present
	if (idsToFetch.length === 0) {
		return existingData;
	}

	// Fetch only missing translations
	const fetchPromises = idsToFetch.map(async (id) => {
		const url = `${staticEndpoint}/translations/data/translation_${id}.json?v=112`;
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to fetch translation ID ${id}`);
			const data = await res.json();
			return { id, data };
		} catch (err) {
			console.error(`Error fetching translation ${id}:`, err);
			return { id, data: null };
		}
	});

	const results = await Promise.all(fetchPromises);

	// Merge fetched data into existing store data
	const updatedData = { ...existingData };
	for (const { id, data } of results) {
		if (data) {
			updatedData[id] = data;
		}
	}

	// Update the store (merge, don't reset to null!)
	if (!props.skipSave) {
		__verseTranslationData.set(updatedData);
	}

	return updatedData;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}
