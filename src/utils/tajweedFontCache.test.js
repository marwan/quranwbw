import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearTajweedFontCache, readTajweedFontCache, readTajweedFontCacheEntry, writeTajweedFontCache } from './tajweedFontCache';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1';

beforeEach(() => {
	localStorage.clear();
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('tajweedFontCache', () => {
	test('stores the format with when and how it was chosen, for this user agent only', () => {
		writeTajweedFontCache('otsvg', 'check');
		expect(readTajweedFontCache()).toBe('otsvg');
		expect(readTajweedFontCacheEntry()).toMatchObject({ support: 'otsvg', method: 'check', userAgent: IPHONE });

		// another browser version (or OS update) does not reuse it
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE.replace('Version/26.2', 'Version/26.4'));
		expect(readTajweedFontCache()).toBeNull();
	});

	test('ignores an unreadable entry and can be cleared', () => {
		localStorage.setItem('tajweedFontSupport', '{not json');
		expect(readTajweedFontCache()).toBeNull();
		writeTajweedFontCache('colrv1', 'check');
		clearTajweedFontCache();
		expect(readTajweedFontCache()).toBeNull();
	});
});
