import { db } from '../db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { apiEndpoint, staticEndpoint, apiVersion, apiByPassCache } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';

// Fetch specific verses (startVerse to endVerse) and cache chapter data
export async function fetchChapterData(props) {
	__chapterData.set(null);
	const fontType = get(__fontType);
	const wordTranslation = get(__wordTranslation);
	const wordTransliteration = get(__wordTransliteration);

	// Generate a unique key for the data
	const cacheKey = `${props.chapter}--${selectableFontTypes[fontType].apiId}--${wordTranslation}--${wordTransliteration}`;

	// Check if data exists in the database
	const cachedRecord = await db.api_data.get(cacheKey);
	if (cachedRecord && cachedRecord.data) {
		if (!props.skipSave) __chapterData.set(cachedRecord.data);
		return cachedRecord.data;
	}

	// Build the API URL
	const apiURL =
		`${apiEndpoint}/chapter?` +
		new URLSearchParams({
			chapter: props.chapter,
			word_type: selectableFontTypes[fontType].apiId,
			word_translation: wordTranslation,
			word_transliteration: wordTransliteration,
			verse_translation: '1,3',
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
	await db.api_data.put({ key: cacheKey, data: data.data.verses });

	// Update the store if required
	if (!props.skipSave) __chapterData.set(data.data.verses);

	return data.data.verses;
}

// Get verse translations from Quran.com's API as a separate request compared to the rest of the verse data (from our API)
// Fetch verse translation data and cache it
export async function fetchVerseTranslationData(chapter, translations = get(__verseTranslations).toString()) {
	__verseTranslationData.set(null);

	// Generate a unique key for the data
	const cacheKey = `${chapter}--${translations}`;

	// Check if data exists in the database
	const cachedRecord = await db.api_data.get(cacheKey);
	if (cachedRecord && cachedRecord.data) {
		__verseTranslationData.set(cachedRecord.data);
		return cachedRecord.data;
	}

	// Build the API URL
	const apiURL =
		`https://api.qurancdn.com/api/qdc/verses/by_chapter/${chapter}?` +
		new URLSearchParams({
			per_page: 286,
			translations: translations
		});

	// Fetch data from the API
	const response = await fetch(apiURL);
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save the fetched data to the database with the custom key
	await db.api_data.put({ key: cacheKey, data: data.verses });

	// Update the store
	__verseTranslationData.set(data.verses);

	return data.verses;
}

// Fetch individual verses
export async function fetchVersesData(props) {
	if (!props.skipSave) __chapterData.set(null);

	// Set default props, we still try to get the props from function invokations for reactivity
	if (!props.fontType) props.fontType = get(__fontType);
	if (!props.wordTranslation) props.wordTranslation = get(__wordTranslation);
	if (!props.wordTransliteration) props.wordTransliteration = get(__wordTransliteration);

	const apiURL =
		`${apiEndpoint}/verses?` +
		new URLSearchParams({
			verses: props.verses,
			word_type: selectableFontTypes[props.fontType].apiId,
			word_translation: props.wordTranslation,
			word_transliteration: props.wordTransliteration,
			verse_translation: '1,3',
			version: apiVersion,
			bypass_cache: apiByPassCache
		});

	const response = await fetch(apiURL);
	const data = await response.json();
	if (!props.skipSave) __chapterData.set(data.data.verses);
	return data.data.verses;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}
