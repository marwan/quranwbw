// Max number of reading history entries to keep
const maxHistoryEntries = 20;

// Page types that count as "reader" pages for history tracking
const readerPages = ['chapter', 'mushaf', 'juz', 'hizb'];

// Tracks the current reading session's entry ID to allow in-place verse updates
let activeSessionId = null;

// Updates reading history for the current session.
// If the active session is still on the same chapter, updates the verse in place.
// Otherwise, starts a new session entry and prepends it to the history.
export function updateReadingHistory({ history, data }) {
	const activeEntry = history.find((entry) => entry.id === activeSessionId);

	// Same chapter — just update the verse position without adding a new entry
	if (activeEntry && activeEntry.chapter === data.chapter) {
		activeEntry.verse = data.verse;
		return [...history];
	}

	// New chapter or new session — create a fresh entry and push it to the front
	const newEntry = {
		id: crypto.randomUUID(),
		chapter: data.chapter,
		verse: data.verse
	};

	activeSessionId = newEntry.id;
	return [newEntry, ...history].slice(0, maxHistoryEntries);
}

// Clears the active session ID, forcing the next navigation to create a new history entry
export function resetReadingHistorySession() {
	activeSessionId = null;
}

// Returns true if the given page type should trigger reading history updates
export function isReaderPage(page) {
	return readerPages.includes(page);
}
