// localStorage cache of the Tajweed color font check (see tajweedFontSupport.js), kept free of imports so stores.js can read it
// at startup without an import cycle.
// Entry: { version, userAgent, support: 'colrv1' | 'otsvg' | 'none', detectedAt (ms timestamp), method: 'check' | 'webkit-27-or-newer' }
// It is only valid for the exact user agent that produced it: a browser or OS update runs the check again.

const STORAGE_KEY = 'tajweedFontSupport';
const CACHE_VERSION = 1;

// Cached entry for this exact user agent, or null
export function readTajweedFontCacheEntry() {
	try {
		const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (cached && cached.version === CACHE_VERSION && cached.userAgent === navigator.userAgent) return cached;
	} catch {
		// unreadable cache: run the check again
	}
	return null;
}

// Cached format for this exact user agent, or null
export function readTajweedFontCache() {
	const cached = readTajweedFontCacheEntry();
	return cached ? cached.support : null;
}

export function writeTajweedFontCache(support, method) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CACHE_VERSION, userAgent: navigator.userAgent, support, detectedAt: Date.now(), method }));
	} catch {
		// storage full or unavailable: the check simply runs again next time
	}
}

export function clearTajweedFontCache() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// storage unavailable: nothing cached anyway
	}
}
