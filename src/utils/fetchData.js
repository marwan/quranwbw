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
	// await db.api_data.put({ key: cacheKey, data: data.data.verses });

	// Update the store if required
	if (!props.skipSave) __chapterData.set(data.data.verses);

	return data.data.verses;
}

// Get verse translations from Quran.com's API as a separate request compared to the rest of the verse data (from our API)
// Fetch verse translation data and cache it
export async function fetchVerseTranslationData(props) {
	if (!props.skipSave) __verseTranslationData.set(null);

	if (!props.translations) props.translations = get(__verseTranslations).toString();

	// // Generate a unique key for the data
	// const cacheKey = `${props.chapter}--${props.translations}`;

	// // Check if data exists in the database
	// const cachedRecord = await db.api_data.get(cacheKey);
	// if (cachedRecord && cachedRecord.data) {
	// 	if (!props.skipSave) __verseTranslationData.set(cachedRecord.data);
	// 	return cachedRecord.data;
	// }

	// Build the API URL
	const apiURL =
		`https://api.qurancdn.com/api/qdc/verses/by_chapter/${props.chapter}?` +
		new URLSearchParams({
			per_page: 286,
			translations: props.translations
		});

	// Fetch data from the API
	const response = await fetch(apiURL);
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save the fetched data to the database with the custom key
	// await db.api_data.put({ key: cacheKey, data: data.verses });

	// Update the store
	if (!props.skipSave) __verseTranslationData.set(data.verses);

	return data.verses;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(apiURL);
	const data = await response.json();
	__timestampData.set(data);
}
