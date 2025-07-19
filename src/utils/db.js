import Dexie from 'dexie';

export const db = new Dexie('quranwbw');
db.version(1).stores({
	chapter_data: 'key',
	translation_data: 'key',
	morphology_data: 'key',
	tafsir_data: 'key',
	other_data: 'key'
});
