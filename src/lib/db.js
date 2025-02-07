import Dexie from 'dexie';

export const db = new Dexie('quranwbw');
db.version(1).stores({
	api_data: 'key' // 'key' is the primary key
});
