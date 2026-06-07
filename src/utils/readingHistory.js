const maxHistoryEntries = 20;
const readerPages = ['chapter', 'mushaf', 'juz', 'hizb'];

let activeSessionId = null;

export function updateReadingHistory({ history, data }) {
	const activeEntry = history.find((entry) => entry.id === activeSessionId);

	if (activeEntry && activeEntry.chapter === data.chapter) {
		activeEntry.verse = data.verse;
		return [...history];
	}

	const newEntry = {
		id: crypto.randomUUID(),
		chapter: data.chapter,
		verse: data.verse
	};

	activeSessionId = newEntry.id;
	return [newEntry, ...history].slice(0, maxHistoryEntries);
}

export function resetReadingHistorySession() {
	activeSessionId = null;
}

export function isReaderPage(page) {
	return readerPages.includes(page);
}
