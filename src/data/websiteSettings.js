export const websiteURL = 'QuranWBW.com';

export const websiteTagline = 'Word By Word Translation, Transliteration And Morphology';

export const websiteTitle = `Quran ${websiteTagline} - ${websiteURL}`;

export const wbwLanguages = 'English, Urdu, Hindi, Indonesian, Bangla, Turkish, Tamil, French, German, Chinese, Malayalam, Divehi, Sindhi and Albanian';

export const apiVersion = 133;

export const useLocalAPI = false;

export const apiByPassCache = false; // If true, api response will not be cached by Cloudflare

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v1' : 'https://api.quranwbw.com/v1';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = 'https://audios.quranwbw.com/words';

export const mushafFontVersion = 5;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const errorLoadingDataMessage = 'Sorry, there was an error while loading the data. Please refresh the page and try again.';

export const splitDelimiter = '||';
