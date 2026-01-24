import { staticEndpoint, mushafWordFontLink } from '$data/websiteSettings';
import { selectableFontTypes, selectableWordTranslations, selectableWordTransliterations, selectableVerseTranslations, selectableReciters } from '$data/options';
import { selectableTafsirs } from '$data/selectableTafsirs';

const uniq = (items) => [...new Set(items.filter(Boolean))];

const staticUrl = (path) => `${staticEndpoint}/${path}`;

export const TOTAL_CHAPTERS = 114;
export const TOTAL_MUSHAF_PAGES = 604;

export const MUSHAF_FONT_VARIANTS = [
	{ key: 'COLRv1', folder: 'COLRv1', suffix: 'COLOR-Regular.woff2', version: 12 },
	{ key: 'COLRv1-Dark-FF', folder: 'COLRv1-Dark-FF', suffix: 'COLOR-Regular.woff2', version: 12 },
	{ key: 'COLRv1-Dark-FF-Non-Colored', folder: 'COLRv1-Dark-FF-Non-Colored', suffix: 'X-Regular.woff2', version: 10 }
];

const BISMILLAH_FONT_FILES = [
	'qcf-bismillah-normal',
	'QCF_Bismillah_COLOR-Regular',
	'QCF_Bismillah_COLOR-Dark-FF-Regular',
	'IndopakBismillah-Arabic',
	'Qcf-nastaleeq-bismillah-normal',
	'qcf-bismillah-bold',
	'Qcf-nastaleeq-bismillah-bold',
	'MisbahBismillah-Arabic'
];

export const getLexiconIndexUrl = () => staticUrl('lexicon/indexes.json');

// --- Granular Resource Getters ---

export function getCoreMetaUrls() {
	return [
		staticUrl('meta/verseKeyData.json?version=2'),
		staticUrl('meta/keysInJuz.json?version=1'),
		staticUrl('meta/keysInPage.json?version=2'),
		staticUrl('tajweed/tajweed-rules.json?version=3'),
		staticUrl('timestamps/timestamps.json?version=2')
	];
}

export function getCoreQuranUrls() {
	return [
		staticUrl('full-quran/uthmani.json?version=1'),
		staticUrl('morphology-data/exact-words-keys.json?version=1')
	];
}

export function getMorphologyUrls() {
	return [
		staticUrl('morphology-data/word-verbs.json?version=1'),
		staticUrl('morphology-data/words-with-same-root-keys.json?version=3'),
		staticUrl('morphology-data/word-uthmani-and-roots.json?version=1')
	];
}

export function getWordFontUrls(fontId = null) {
	const fonts = fontId ? [selectableFontTypes[fontId]].filter(Boolean) : Object.values(selectableFontTypes);
	return fonts.map((font) => staticUrl(`words-data/arabic/${font.id}.json?version=${font.version}`));
}

export function getWordTranslationUrls(translationId = null) {
	const translations = translationId ? [selectableWordTranslations[translationId]].filter(Boolean) : Object.values(selectableWordTranslations);
	return translations.map((translation) => staticUrl(`words-data/translations/${translation.id}.json?version=${translation.version}`));
}

export function getWordTransliterationUrls(transliterationId = null) {
	const transliterations = transliterationId
		? [selectableWordTransliterations[transliterationId]].filter(Boolean)
		: Object.values(selectableWordTransliterations);
	return transliterations.map((transliteration) => staticUrl(`words-data/transliterations/${transliteration.id}.json?version=${transliteration.version}`));
}

export function getVerseTranslationUrls(translationId = null) {
	const translations = translationId
		? [selectableVerseTranslations[translationId]].filter(Boolean)
		: Object.values(selectableVerseTranslations);
	return translations.map((translation) => staticUrl(`verse-translations/${translation.id}.json?version=${translation.version}`));
}

export function getLexiconSummaryUrls() {
	const urls = [];
	for (let chapter = 1; chapter <= TOTAL_CHAPTERS; chapter += 1) {
		urls.push(staticUrl(`lexicon/word-summaries/${chapter}.json?version=2`));
	}
	return urls;
}

export function getTafsirUrls(tafsirSlug = null) {
	const urls = [];
	const tafsirBases = {
		1: 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
		2: staticUrl('tafsirs')
	};

	const tafsirs = tafsirSlug ? Object.values(selectableTafsirs).filter((t) => t.slug === tafsirSlug) : Object.values(selectableTafsirs);

	tafsirs.forEach((tafsir) => {
		const base = tafsirBases[tafsir.url];
		if (!base) return;

		for (let chapter = 1; chapter <= TOTAL_CHAPTERS; chapter += 1) {
			urls.push(`${base}/${tafsir.slug}/${chapter}.json`);
		}
	});

	return urls;
}

export function getOfflineJsonUrls() {
	// Wrapper for backward compatibility or "Download All" if needed,
	// though it's better to compose from the above functions.
	return uniq([
		...getCoreMetaUrls(),
		...getCoreQuranUrls(),
		...getMorphologyUrls(),
		...getWordFontUrls(),
		...getWordTranslationUrls(),
		...getWordTransliterationUrls(),
		...getVerseTranslationUrls(),
		...getLexiconSummaryUrls(),
		...getTafsirUrls(),
		getLexiconIndexUrl()
	]);
}


export function getReciterImageUrls(reciterId = null) {
    const reciters = reciterId ? [selectableReciters[reciterId]].filter(Boolean) : Object.values(selectableReciters);
    const urls = [];
    reciters.forEach((reciter) => {
		if (reciter.image) {
			urls.push(staticUrl(`images/reciters/${reciter.image}`));
		}
	});
    return urls;
}

export function getOfflineAssetUrls() {
	const urls = [
		staticUrl('tajweed/Makharij%20Al%20Huroof.pdf'),
		staticUrl('fonts/Extras/chapter-headers/NeoHeader_COLOR-Regular.woff2?version=12')
	];

	BISMILLAH_FONT_FILES.forEach((file) => {
		urls.push(staticUrl(`fonts/Extras/bismillah/${file}.woff2?version=13`));
	});

    // Add all reciter images by default for "all assets"
    urls.push(...getReciterImageUrls());

	return uniq(urls);
}

export function getMushafFontUrls(variants = MUSHAF_FONT_VARIANTS) {
	const urls = [];

	for (let page = 1; page <= TOTAL_MUSHAF_PAGES; page += 1) {
		const paddedPage = String(page).padStart(3, '0');
		variants.forEach((variant) => {
			urls.push(`${mushafWordFontLink}/${variant.folder}/QCF4${paddedPage}_${variant.suffix}?version=${variant.version}`);
		});
	}

	return uniq(urls);
}
