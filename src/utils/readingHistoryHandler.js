// Max number of reading history entries to keep
const maxHistoryEntries = 50;

// Page types that count as "reader" pages for history tracking
const readerPages = ['chapter', 'mushaf', 'juz', 'hizb'];

// How long a position must stay unchanged before it is saved to history (ms).
// Prevents wrong verses being recorded while fonts load or the layout shifts.
const stabilityDelay = 2500;

// ID of the history entry the current reading session should update.
// null means no session yet, so the next stable position creates a new entry.
let activeSessionId = null;

// Timer for the pending (debounced) history update
let pendingTimer = null;

// Starts a new reading session.
// - No argument: fresh session, the next stable position creates a new entry.
// - With an entry ID: resumes that entry, further reading updates it in place.
export function startReadingSession(entryId = null) {
	// Drop any pending update, it belongs to the previous session
	clearTimeout(pendingTimer);
	pendingTimer = null;

	activeSessionId = entryId;
}

// Kept for backwards compatibility, same as starting a fresh session
export function resetReadingHistorySession() {
	startReadingSession(null);
}

// Pure function: applies a reading position to the history and returns the new array.
// Updates the active entry in place (and moves it to the front), or creates a new one.
export function updateReadingHistory({ history, data }) {
	// Guard against missing/corrupt history (e.g. older users)
	const list = Array.isArray(history) ? history : [];
	const now = Date.now();

	// Never go below verse 1
	const verse = Math.max(1, data.verse);

	// Look up the entry for the active session
	const index = activeSessionId ? list.findIndex((entry) => entry.id === activeSessionId) : -1;

	// Active session found, update it and move it to the front.
	// Chapter is updated too, so juz/hizb/mushaf pages that cross surahs keep working.
	if (index !== -1) {
		const updatedEntry = { ...list[index], chapter: data.chapter, verse, updatedAt: now };
		return [updatedEntry, ...list.filter((_, i) => i !== index)];
	}

	// No active session (or its entry was removed), create a fresh entry at the front
	const newEntry = {
		id: crypto.randomUUID(),
		chapter: data.chapter,
		verse,
		createdAt: now,
		updatedAt: now
	};

	activeSessionId = newEntry.id;
	return [newEntry, ...list].slice(0, maxHistoryEntries);
}

// Debounced history update. Only the latest position within the stability window is saved.
// - getHistory: returns the current history array (read at commit time, so it is never stale)
// - onCommit: receives the new history array and should persist it
export function queueReadingHistoryUpdate({ data, getHistory, onCommit }) {
	clearTimeout(pendingTimer);

	// Copy the data, the caller may mutate the original object later
	const position = { chapter: data.chapter, verse: data.verse };

	pendingTimer = setTimeout(() => {
		pendingTimer = null;
		onCommit(updateReadingHistory({ history: getHistory(), data: position }));
	}, stabilityDelay);
}

// Returns true if the given page type should trigger reading history updates
export function isReaderPage(page) {
	return readerPages.includes(page);
}
