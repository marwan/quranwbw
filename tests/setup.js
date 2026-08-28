import { vi } from 'vitest';

// In-memory localStorage polyfill ensuring bare `localStorage` works in hooks.client.js
function createMemoryStorage() {
	let store = {};
	return {
		getItem(k) { return store[k] ?? null; },
		setItem(k, v) { store[k] = String(v); },
		removeItem(k) { delete store[k]; },
		clear() { store = {}; },
		key(n) { return Object.keys(store)[n] ?? null; },
		get length() { return Object.keys(store).length; }
	};
}
const memStorage = createMemoryStorage();

// Polyfill global localStorage for jsdom consistency - ensure bare `localStorage` works in hooks.client.js
if (typeof window !== 'undefined') {
	if (!window.localStorage) window.localStorage = memStorage;
	if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = window.localStorage;
	if (typeof global !== 'undefined' && typeof global.localStorage === 'undefined') global.localStorage = window.localStorage;
	// also alias bare localStorage if not defined
	try {
		if (typeof localStorage === 'undefined') globalThis.localStorage = window.localStorage;
	} catch (_e) { /* ignore */ }
	// ensure all point to same mock
	if (globalThis.localStorage !== window.localStorage) {
		// prefer window storage but sync
		globalThis.localStorage = window.localStorage;
	}
	if (typeof global !== 'undefined' && global.localStorage !== window.localStorage) {
		global.localStorage = window.localStorage;
	}
} else {
	// no window (node), ensure global has storage
	if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = memStorage;
	if (typeof global !== 'undefined' && typeof global.localStorage === 'undefined') global.localStorage = memStorage;
}

// Stub matchMedia for hooks.client.js defaultSettings
if (typeof window !== 'undefined') {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	});
}
if (typeof globalThis.matchMedia === 'undefined' && typeof window !== 'undefined' && window.matchMedia) {
	globalThis.matchMedia = window.matchMedia;
}
if (typeof global !== 'undefined' && typeof global.matchMedia === 'undefined' && typeof window !== 'undefined' && window.matchMedia) {
	global.matchMedia = window.matchMedia;
}

// jsdom already provides localStorage but ensure clean state before each test
beforeEach(() => {
	// ensure storage polyfill sync per test (jsdom creates fresh window each test)
	if (typeof window !== 'undefined') {
		if (!window.localStorage) window.localStorage = memStorage;
		if (globalThis.localStorage !== window.localStorage) globalThis.localStorage = window.localStorage;
		if (typeof global !== 'undefined' && global.localStorage !== window.localStorage) global.localStorage = window.localStorage;
		// bare localStorage alias
		try { if (typeof localStorage === 'undefined') globalThis.localStorage = window.localStorage; } catch (_e) { /* ignore */ }
	}
	if (typeof globalThis.localStorage === 'undefined' && typeof global !== 'undefined' && global.localStorage) {
		globalThis.localStorage = global.localStorage;
	}
	try {
		globalThis.localStorage?.clear();
	} catch (_e) { /* ignore */ }
	try {
		window?.localStorage?.clear();
	} catch (_e) { /* ignore */ }
	try {
		global?.localStorage?.clear();
	} catch (_e) { /* ignore */ }
	vi.clearAllMocks();
	// default umami stub
	if (typeof window !== 'undefined') {
		window.umami = window.umami || { track: vi.fn() };
		window.umami.track = vi.fn();
	}
	globalThis.window = globalThis.window || window || {};
	if (!globalThis.window.umami) globalThis.window.umami = { track: vi.fn() };
	else globalThis.window.umami.track = vi.fn();
});

// Provide stable quranMetaData mock via vitest manual mock?
// We'll let actual file be imported; quranMetaData is large but valid.

globalThis.__svelteMocks = {};
