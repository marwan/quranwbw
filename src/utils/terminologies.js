import { get } from 'svelte/store';
import { __englishTerminology } from '$utils/stores';

export const englishTerms = {
	true: {
		chapter: 'Chapter',
		chapters: 'Chapters',
		verse: 'Verse',
		verses: 'Verses',
		supplications: 'Supplications',
		tafsir: 'Exegesis',
		tajweed: 'Pronunciation',
		juz: 'Part',
		juzs: 'Parts',
		hizb: 'Quarter',
		hizbs: 'Quarters',
		meccan: 'Meccan',
		medinan: 'Medinan'
	},
	false: {
		chapter: 'Surah',
		chapters: 'Surah',
		verse: 'Ayah',
		verses: 'Ayat',
		supplications: 'Duas',
		tafsir: 'Tafsir',
		tajweed: 'Tajweed',
		juz: 'Juz',
		juzs: 'Juz',
		hizb: 'Hizb',
		hizbs: 'Hizb',
		meccan: 'Makki',
		medinan: 'Madani'
	}
};

export function term(terminology) {
	const isEnglish = get(__englishTerminology);
	return englishTerms[isEnglish][terminology];
}
