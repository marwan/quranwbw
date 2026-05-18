export const websiteURL = 'QuranWBW.com';

export const websiteTagline = 'Word By Word Translation, Transliteration And Morphology';

export const websiteTitle = `Quran ${websiteTagline} - ${websiteURL}`;

export const wbwLanguages = 'English, Urdu, Hindi, Indonesian, Bangla, Turkish, Tamil, French, German, Chinese, Malayalam, Divehi, Sindhi, Persian and Albanian';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = 'https://audios.quranwbw.com/words';

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4`;

export const chapterHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/NeoHeader_COLOR-Regular.woff2?version=12`;

export const cdnStaticDataUrls = {
	fullQuranUthmani: `${staticEndpoint}/full-quran/uthmani.json?version=1`,
	verseKeyData: `${staticEndpoint}/meta/verseKeyData.json?version=3`,
	tajweedRules: `${staticEndpoint}/tajweed/tajweed-rules.json?version=3`,
	quranTopics: `${staticEndpoint}/others/quran-topics.json?version=1`
};

// Map of morphology data URLs
export const morphologyDataUrls = {
	// Word summaries for each chapter (1-114)
	getWordSummary: (chapter) => `${staticEndpoint}/lexicon/word-summaries/${chapter}.json?version=2`,

	// Static morphology data files
	wordVerbs: `${staticEndpoint}/morphology-data/word-verbs.json?version=1`,
	wordsWithSameRootKeys: `${staticEndpoint}/morphology-data/words-with-same-root-keys.json?version=3`,
	wordUthmaniAndRoots: `${staticEndpoint}/morphology-data/word-uthmani-and-roots.json?version=1`,
	exactWordsKeys: `${staticEndpoint}/morphology-data/exact-words-keys.json?version=1`
};

// We have all the tafsirs on first endpoint and Tafheem Ul Quran (urdu) on second
export const tafsirDataUrls = {
	1: 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
	2: 'https://static.quranwbw.com/data/v4/tafsirs'
};
