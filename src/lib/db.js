import Dexie from 'dexie';

export const db = new Dexie('quranwbw');
db.version(1).stores({
	chapter_data: 'key',
	translation_data: 'key',
	data_version: 'key'
});
