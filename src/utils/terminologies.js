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
		juz: 'Part (Juz)',
		juzs: 'Parts (Juz)',
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
		meccan: 'Makki',
		medinan: 'Madani'
	}
};

export function term(terminology) {
	const isEnglish = get(__englishTerminology);
	return englishTerms[isEnglish][terminology];
}
