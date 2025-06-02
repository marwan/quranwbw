// import { db } from '$lib/db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { apiEndpoint, staticEndpoint, apiVersion, apiByPassCache } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';

// Fetch specific verses (startVerse to endVerse) and cache chapter data
export async function fetchChapterData(props) {
	if (!props.skipSave) __chapterData.set(null);
	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	// // Generate a unique key for the data
	// const cacheKey = `${props.chapter}--${selectableFontTypes[fontType].apiId}--${wordTranslation}--${wordTransliteration}`;

	// // Check if data exists in the database
	// const cachedRecord = await db.api_data.get(cacheKey);
	// if (cachedRecord && cachedRecord.data) {
	// 	if (!props.skipSave) __chapterData.set(cachedRecord.data);
	// 	return cachedRecord.data;
	// }

	// Build the API URL
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

	// Fetch data from the API
	const response = await fetch(apiURL);
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save the fetched data to the database with the custom key
	// await db.api_data.put({ key: cacheKey, data: data.data.verses });

	// Update the store if required
	if (!props.skipSave) __chapterData.set(data.data.verses);

	return data.data.verses;
}

// Fetch verse translation data
export async function fetchVerseTranslationData(props) {
	// Use translation IDs from props or fallback to store
	if (!props.translations) props.translations = get(__verseTranslations);

	// Get current data in store (don't clear the store before this!)
	const existingData = get(__verseTranslationData) || {};

	// Filter translation IDs to only those not already in store
	const idsToFetch = props.translations.filter((id) => !existingData[id]);

	// Start with whatever is already in the store
	const finalData = { ...existingData };

	// If nothing to fetch, just return existing data
	if (idsToFetch.length === 0) {
		return finalData;
	}

	// Only clear the store if new data will be fetched and saved
	if (!props.skipSave) __verseTranslationData.set(null);

	// Fetch missing translations
	const fetchPromises = idsToFetch.map(async (id) => {
		const url = `https://static.quranwbw.com/data/v4/translations/data/translation_${id}.json?v=112`;
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to fetch translation with ID ${id}`);
			const data = await res.json();
			return { id, data };
		} catch (err) {
			console.error(`Error fetching translation ${id}:`, err);
			return { id, data: null };
		}
	});

	const results = await Promise.all(fetchPromises);

	// Merge fetched data into final result
	for (const { id, data } of results) {
		if (data) {
			finalData[id] = data;
		}
	}

	// Save to store if required
	if (!props.skipSave) __verseTranslationData.set(finalData);

	return finalData;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}
