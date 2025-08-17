import Dexie from 'dexie';

export const db = new Dexie('quranwbw');

db.version(1).stores({
	word_data: 'key',
	verse_translation_data: 'key',
	morphology_data: 'key',
	tafsir_data: 'key',
	other_data: 'key'
});

export const cacheTableMap = {
	word: db.word_data,
	translation: db.verse_translation_data,
	morphology: db.morphology_data,
	tafsir: db.tafsir_data,
	other: db.other_data
};
