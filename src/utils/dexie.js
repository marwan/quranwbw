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

// Clears all records from the specified Dexie table without altering its schema
export async function clearDexieTable(tableName) {
	if (!db.tables.some((t) => t.name === tableName)) {
		console.warn(`Table "${tableName}" does not exist`);
		return;
	}

	await db.table(tableName).clear();
	console.log(`Table "${tableName}" cleared successfully`);
}

// Completely deletes the Dexie database
export async function deleteDexieDatabase() {
	try {
		db.close();
		await db.delete();
		console.log(`Dexie database "${db.name}" deleted`);
	} catch (error) {
		console.warn('Failed to delete Dexie database', error);
		throw error;
	}
}
