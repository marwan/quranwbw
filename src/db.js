import Dexie from 'dexie';

export const db = new Dexie('quranwbw_local_db');
db.version(1).stores({
	data: 'key' // 'key' is the primary key
});
