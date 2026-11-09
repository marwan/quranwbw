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

// Last URL seen by the navigation hook
let lastUrl = null;

// Timer for the pending (debounced) history update
let pendingTimer = null;

// The session is kept in sessionStorage (per tab) so a full page reload, a service worker update
// or the mobile browser discarding the tab keeps updating the same entry instead of creating a new one
const sessionStorageKey = 'readingHistorySession';

function saveSessionState() {
	try {
		sessionStorage.setItem(sessionStorageKey, JSON.stringify({ activeSessionId, lastUrl: lastUrl?.href ?? null }));
	} catch {
		// Storage unavailable (private mode, blocked site data), the session only lives in memory
	}
}

function restoreSessionState() {
	try {
		const saved = JSON.parse(sessionStorage.getItem(sessionStorageKey));
		activeSessionId = saved?.activeSessionId ?? null;
		lastUrl = saved?.lastUrl ? new URL(saved.lastUrl) : null;
	} catch {
		// Nothing saved or storage unavailable, start without a session
	}
}

restoreSessionState();

// Starts a new reading session.
// - No argument: fresh session, the next stable position creates a new entry.
// - With an entry ID: resumes that entry, further reading updates it in place.
function startReadingSession(entryId = null) {
	// Drop any pending update, it belongs to the previous session
	clearTimeout(pendingTimer);
	pendingTimer = null;

	activeSessionId = entryId;
	saveSessionState();
}

// Entry ID waiting to be resumed once the upcoming navigation completes
let pendingResumeId = null;

// Called by the history modal or a continue reading button when an entry is clicked.
// The layout's navigation hook runs after the route changes, so the ID is stored until then.
export function resumeReadingSession(entryId, targetUrl) {
	// Same URL means no navigation will happen, so resume immediately
	if (targetUrl === location.pathname + location.search) {
		startReadingSession(entryId);
		return;
	}

	pendingResumeId = entryId;
}

// Resumes the most recent history entry if it matches the last read position,
// so continue reading buttons keep updating the same entry instead of creating a duplicate
export function resumeLatestReadingSession({ history, lastRead, targetUrl }) {
	const latestEntry = Array.isArray(history) ? history[0] : null;
	if (!latestEntry || latestEntry.chapter !== lastRead?.chapter) return;

	resumeReadingSession(latestEntry.id, targetUrl);
}

// Reader pages that are read sequentially through their "id" param (mushaf page, juz, hizb)
const sequentialPathnames = ['/page', '/juz', '/hizb'];

// Max "id" difference still treated as continuous reading (covers next/previous page, juz, hizb)
const maxSequentialStep = 2;

// Returns true if moving from one URL to the next is a continuation of the same reading,
// for example turning a mushaf page or loading previous verses, rather than going somewhere new
function isSameReading(previous, next) {
	if (!previous || previous.pathname !== next.pathname) return false;

	// Chapter pages only change their query (startVerse) while reading the same chapter
	if (!sequentialPathnames.includes(next.pathname)) return true;

	// Jumping far away (e.g. page 10 to 400 via the navigation modal) starts a new entry
	const previousId = Number(previous.searchParams.get('id'));
	const nextId = Number(next.searchParams.get('id'));
	return Math.abs(nextId - previousId) <= maxSequentialStep;
}

// Called by the layout on every navigation.
// Resumes the pending history entry if there is one, keeps the session while reading continues
// on the same page type, otherwise starts a fresh session.
export function handleReadingNavigation(url) {
	const previous = lastUrl;
	lastUrl = new URL(url, location.href);

	// Page store updates and page reloads without a URL change are not navigations
	if (previous && previous.href === lastUrl.href) return;

	saveSessionState();

	const entryId = pendingResumeId;
	pendingResumeId = null;

	if (entryId) {
		startReadingSession(entryId);
		return;
	}

	if (isSameReading(previous, lastUrl)) return;

	startReadingSession(null);
}

// Returns the URL that reopens a history entry in the view it was read in.
// Older entries without a page type open in the chapter view.
export function getReadingHistoryEntryUrl(entry) {
	const verseKey = `${entry.chapter}:${entry.verse}`;

	switch (entry.currentPage) {
		case 'mushaf':
			if (entry.page) return `/page?id=${entry.page}`;
			break;
		case 'juz':
			if (entry.juz) return `/juz?id=${entry.juz}&startKey=${verseKey}`;
			break;
		case 'hizb':
			if (entry.hizb) return `/hizb?id=${entry.hizb}&startKey=${verseKey}`;
			break;
	}

	return `/${entry.chapter}?startVerse=${entry.verse}`;
}

// Generates a unique entry ID. crypto.randomUUID only exists in secure contexts (HTTPS/localhost),
// so this also works when the site is opened over plain HTTP (e.g. local network on a phone).
function generateEntryId() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Keeps only the position fields stored in a history entry
function getEntryPosition(data, verse) {
	return {
		chapter: data.chapter,
		verse,
		currentPage: data.currentPage,
		page: data.page,
		juz: data.juz,
		hizb: data.hizb
	};
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
	// Position fields are updated too, so juz/hizb/mushaf pages that cross surahs keep working.
	if (index !== -1) {
		const updatedEntry = { ...list[index], ...getEntryPosition(data, verse), updatedAt: now };
		return [updatedEntry, ...list.filter((_, i) => i !== index)];
	}

	// No active session (or its entry was removed), create a fresh entry at the front
	const newEntry = {
		id: generateEntryId(),
		...getEntryPosition(data, verse),
		createdAt: now,
		updatedAt: now
	};

	activeSessionId = newEntry.id;
	saveSessionState();
	return [newEntry, ...list].slice(0, maxHistoryEntries);
}

// Pure function: returns the history without the given entry
export function removeReadingHistoryEntry({ history, entryId }) {
	const list = Array.isArray(history) ? history : [];
	return list.filter((entry) => entry.id !== entryId);
}

// Debounced history update. Only the latest position within the stability window is saved.
// - getHistory: returns the current history array (read at commit time, so it is never stale)
// - onCommit: receives the new history array and should persist it
export function queueReadingHistoryUpdate({ data, getHistory, onCommit }) {
	clearTimeout(pendingTimer);

	// Copy the data, the caller may mutate the original object later
	const position = getEntryPosition(data, data.verse);

	pendingTimer = setTimeout(() => {
		pendingTimer = null;
		onCommit(updateReadingHistory({ history: getHistory(), data: position }));
	}, stabilityDelay);
}

// Returns true if the given page type should trigger reading history updates
export function isReaderPage(page) {
	return readerPages.includes(page);
}
