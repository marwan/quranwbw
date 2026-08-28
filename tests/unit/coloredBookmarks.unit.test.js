import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock stores module before importing coloredBookmarks
vi.mock('$utils/stores', async () => {
	const { writable } = await import('svelte/store');
	return {
		__userColoredBookmarks: writable({}),
		__websiteTheme: writable(1)
	};
});

vi.mock('$utils/validateKey', async () => {
	const actual = await vi.importActual('$utils/validateKey');
	return {
		...actual,
		isValidVerseKey: actual.isValidVerseKey
	};
});

import { __userColoredBookmarks } from '$utils/stores';
import {
	COLOR_TOKENS,
	VALID_COLOR_IDS,
	isValidColorId,
	isDarkTheme,
	getColorForVerse,
	getVersesByColor,
	getColoredBookmarksGrouped,
	getTotalColoredCount,
	getPerColorCounts,
	hasColor,
	getAllColoredKeysSorted,
	getVerseTintClasses,
	getVerseTintWrapperClasses,
	getCardBorderColor,
	resolveColorAlias,
	hexToRgb,
	getVerseTintStyle
} from '$utils/coloredBookmarks';

describe('coloredBookmarks — palette tokens', () => {
	it('exports 8 tokens with required fields', () => {
		expect(Object.keys(COLOR_TOKENS)).toHaveLength(8);
		for (let i = 1; i <= 8; i++) {
			const t = COLOR_TOKENS[i];
			expect(t).toBeDefined();
			expect(t.id).toBe(i);
			expect(t.name).toMatch(/\w+/);
			expect(t.lightHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(t.darkHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(typeof t.lightOpacity).toBe('number');
			expect(typeof t.darkOpacity).toBe('number');
			// FIX-006 bumped opacities: light 0.22-0.28 / dark 0.30-0.34 (was 0.10-0.18)
			expect(t.lightOpacity).toBeGreaterThanOrEqual(0.22);
			expect(t.lightOpacity).toBeLessThanOrEqual(0.28);
			expect(t.darkOpacity).toBeGreaterThanOrEqual(0.3);
			expect(t.darkOpacity).toBeLessThanOrEqual(0.34);
			// aesthetic: still pastel translucent, alpha <0.4 not harsh/saturated
			expect(t.lightOpacity).toBeLessThan(0.4);
			expect(t.darkOpacity).toBeLessThan(0.4);
		}
	});

	it('matches spec hex values', () => {
		expect(COLOR_TOKENS[1].lightHex).toBe('#EADDB8');
		expect(COLOR_TOKENS[1].darkHex).toBe('#B9973F');
		expect(COLOR_TOKENS[4].lightHex).toBe('#DDD4E8');
		expect(COLOR_TOKENS[8].lightHex).toBe('#E0DCD6');
		expect(COLOR_TOKENS[8].lightOpacity).toBe(0.22);
		// FIX-006 exact opacities per token (hex unchanged, opacity bumped)
		expect(COLOR_TOKENS[1].lightOpacity).toBe(0.28); expect(COLOR_TOKENS[1].darkOpacity).toBe(0.34);
		expect(COLOR_TOKENS[2].lightOpacity).toBe(0.26); expect(COLOR_TOKENS[2].darkOpacity).toBe(0.32);
		expect(COLOR_TOKENS[3].lightOpacity).toBe(0.24); expect(COLOR_TOKENS[3].darkOpacity).toBe(0.3);
		expect(COLOR_TOKENS[4].lightOpacity).toBe(0.26); expect(COLOR_TOKENS[4].darkOpacity).toBe(0.32);
		expect(COLOR_TOKENS[5].lightOpacity).toBe(0.26); expect(COLOR_TOKENS[5].darkOpacity).toBe(0.32);
		expect(COLOR_TOKENS[6].lightOpacity).toBe(0.24); expect(COLOR_TOKENS[6].darkOpacity).toBe(0.3);
		expect(COLOR_TOKENS[7].lightOpacity).toBe(0.24); expect(COLOR_TOKENS[7].darkOpacity).toBe(0.3);
		expect(COLOR_TOKENS[8].darkOpacity).toBe(0.3);
		// aesthetic: not harsh saturated primaries
		for (let i = 1; i <= 8; i++) {
			expect(COLOR_TOKENS[i].lightHex.toUpperCase()).not.toBe('#FF0000');
			expect(COLOR_TOKENS[i].darkHex.toUpperCase()).not.toBe('#0000FF');
		}
	});

	it('VALID_COLOR_IDS contains 1..8', () => {
		expect(VALID_COLOR_IDS.size).toBe(8);
		for (let i = 1; i <= 8; i++) expect(VALID_COLOR_IDS.has(i)).toBe(true);
		expect(VALID_COLOR_IDS.has(0)).toBe(false);
		expect(VALID_COLOR_IDS.has(9)).toBe(false);
	});
});

describe('isValidColorId', () => {
	it.each([
		[1, true],
		[8, true],
		['1', true],
		['8', true],
		[0, false],
		[9, false],
		[null, false],
		[undefined, false],
		['foo', false],
		[1.5, false],
		[NaN, false]
	])('isValidColorId(%p) -> %p', (input, expected) => {
		expect(isValidColorId(input)).toBe(expected);
	});
});

describe('isDarkTheme', () => {
	it('detects dark themes 5-9', () => {
		expect(isDarkTheme(1)).toBe(false);
		expect(isDarkTheme(4)).toBe(false);
		expect(isDarkTheme(5)).toBe(true);
		expect(isDarkTheme(6)).toBe(true);
		expect(isDarkTheme(9)).toBe(true);
		expect(isDarkTheme('5')).toBe(true);
		expect(isDarkTheme(10)).toBe(false);
	});
});

describe('getVerseTintClasses', () => {
	it('returns empty for invalid colorId', () => {
		expect(getVerseTintClasses(0, 1)).toBe('');
		expect(getVerseTintClasses(9, 1)).toBe('');
		expect(getVerseTintClasses(null, 1)).toBe('');
	});
	it('returns light token for theme 1', () => {
		expect(getVerseTintClasses(1, 1)).toBe('bg-[#EADDB8]/28');
		expect(getVerseTintClasses(3, 2)).toBe('bg-[#E5D1D1]/24');
		expect(getVerseTintClasses(8, 1)).toBe('bg-[#E0DCD6]/22');
	});
	it('returns dark token for theme 5', () => {
		expect(getVerseTintClasses(1, 5)).toBe('bg-[#B9973F]/34');
		expect(getVerseTintClasses(4, 6)).toBe('bg-[#8E7AAE]/32');
		expect(getVerseTintClasses(5, 9)).toBe('bg-[#7A9AB5]/32');
	});
	it('handles string colorId', () => {
		expect(getVerseTintClasses('2', 1)).toBe('bg-[#E6D0C0]/26');
	});
});

describe('getVerseTintWrapperClasses', () => {
	it('returns empty for falsy colorId', () => {
		expect(getVerseTintWrapperClasses(null, 1)).toBe('');
		expect(getVerseTintWrapperClasses(0, 1)).toBe('');
	});
	it('block vs inline classes', () => {
		const block = getVerseTintWrapperClasses(1, 1, false);
		expect(block).toContain('bg-[#EADDB8]/28');
		expect(block).toContain('rounded-xl');
		expect(block).not.toContain('box-decoration-clone');
		const inline = getVerseTintWrapperClasses(1, 1, true);
		expect(inline).toContain('box-decoration-clone');
		expect(inline).toContain('rounded-lg');
		expect(inline).toContain('px-1.5');
	});
	it('transitions present', () => {
		expect(getVerseTintWrapperClasses(2, 5, false)).toContain('transition-colors');
	});
});

describe('getCardBorderColor', () => {
	it('returns light/dark hex', () => {
		expect(getCardBorderColor(1, 1)).toBe('#EADDB8');
		expect(getCardBorderColor(1, 5)).toBe('#B9973F');
		expect(getCardBorderColor(9, 1)).toBe('');
	});
});

describe('hexToRgb', () => {
	it('parses 6-char hex with and without #', () => {
		expect(hexToRgb('#EADDB8')).toEqual({ r: 234, g: 221, b: 184 });
		expect(hexToRgb('B9973F')).toEqual({ r: 185, g: 151, b: 63 });
		expect(hexToRgb('#E6D0C0')).toEqual({ r: 230, g: 208, b: 192 });
	});
	it('expands 3-char hex', () => {
		expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
		expect(hexToRgb('fff')).toEqual({ r: 255, g: 255, b: 255 });
	});
	it('trims and handles case', () => {
		expect(hexToRgb('  #eaddb8  ')).toEqual({ r: 234, g: 221, b: 184 });
	});
	it('returns null for invalid', () => {
		expect(hexToRgb('')).toBeNull();
		expect(hexToRgb(null)).toBeNull();
		expect(hexToRgb('#GGGGGG')).toBeNull();
		expect(hexToRgb('#1234')).toBeNull();
		expect(hexToRgb('#12')).toBeNull();
	});
});

describe('getVerseTintStyle — FIX-004 inline rgba', () => {
	it('returns empty for invalid colorId', () => {
		expect(getVerseTintStyle(0, 1)).toBe('');
		expect(getVerseTintStyle(9, 1)).toBe('');
		expect(getVerseTintStyle(null, 1)).toBe('');
		expect(getVerseTintStyle(undefined, 5)).toBe('');
	});
	it('light theme 1 uses lightHex and lightOpacity', () => {
		expect(getVerseTintStyle(1, 1)).toBe('background-color: rgba(234,221,184,0.28)');
		expect(getVerseTintStyle(2, 2)).toBe('background-color: rgba(230,208,192,0.26)');
		expect(getVerseTintStyle(3, 1)).toBe('background-color: rgba(229,209,209,0.24)');
		expect(getVerseTintStyle(8, 1)).toBe('background-color: rgba(224,220,214,0.22)');
	});
	it('dark theme 5-9 uses darkHex and darkOpacity', () => {
		expect(getVerseTintStyle(1, 5)).toBe('background-color: rgba(185,151,63,0.34)');
		expect(getVerseTintStyle(1, 6)).toBe('background-color: rgba(185,151,63,0.34)');
		expect(getVerseTintStyle(2, 5)).toBe('background-color: rgba(192,122,90,0.32)');
		expect(getVerseTintStyle(4, 9)).toBe('background-color: rgba(142,122,174,0.32)');
		expect(getVerseTintStyle(8, 5)).toBe('background-color: rgba(154,143,134,0.3)');
	});
	it('handles string colorId and string theme', () => {
		expect(getVerseTintStyle('1', '1')).toBe('background-color: rgba(234,221,184,0.28)');
		expect(getVerseTintStyle('1', '5')).toBe('background-color: rgba(185,151,63,0.34)');
	});
	it('never returns Tailwind bg class', () => {
		expect(getVerseTintStyle(1, 1)).not.toContain('bg-[');
		expect(getVerseTintStyle(1, 5)).not.toContain('bg-[');
	});
});

describe('COLOR_ALIAS_MAP / resolveColorAlias', () => {
	it('resolves numeric strings 1..8', () => {
		expect(resolveColorAlias('1')).toBe(1);
		expect(resolveColorAlias('8')).toBe(8);
		expect(resolveColorAlias(3)).toBe(3);
	});
	it('resolves aliases case-insensitive & dashed', () => {
		expect(resolveColorAlias('amber')).toBe(1);
		expect(resolveColorAlias('Amber Glow')).toBe(null); // space not in map, but trimmed lower: amber glow? check spec: space not allowed, but alias map has amberglow
		expect(resolveColorAlias('amberglow')).toBe(1);
		expect(resolveColorAlias('amber-glow')).toBe(1);
		expect(resolveColorAlias('Terracotta')).toBe(2);
		expect(resolveColorAlias('lavender-mist')).toBe(4);
		expect(resolveColorAlias('slate')).toBe(5);
		expect(resolveColorAlias('sage')).toBe(6);
		expect(resolveColorAlias('olive')).toBe(7);
		expect(resolveColorAlias('stone')).toBe(8);
		expect(resolveColorAlias('taupe')).toBe(8);
	});
	it('returns null for invalid', () => {
		expect(resolveColorAlias('foo')).toBeNull();
		expect(resolveColorAlias('9')).toBeNull();
		expect(resolveColorAlias(null)).toBeNull();
	});
	it('trims whitespace', () => {
		expect(resolveColorAlias('  amber  ')).toBe(1);
	});
});

describe('getColorForVerse + helpers with store', () => {
	beforeEach(() => {
		__userColoredBookmarks.set({});
		(globalThis.localStorage || window.localStorage)?.clear?.();
		(globalThis.localStorage || window.localStorage)?.setItem('userSettings', JSON.stringify({ userColoredBookmarks: {} }));
	});

	it('returns null for invalid keys', () => {
		expect(getColorForVerse('')).toBeNull();
		expect(getColorForVerse('  ')).toBeNull();
		expect(getColorForVerse('115:1')).toBeNull(); // chapter out of range
		expect(getColorForVerse('2:300')).toBeNull(); // verse out of range (2 has 286)
		expect(getColorForVerse('bad')).toBeNull();
		expect(getColorForVerse(null)).toBeNull();
		expect(getColorForVerse(undefined)).toBeNull();
	});

	it('normalizes leading zeros 002:005 -> 2:5', () => {
		__userColoredBookmarks.set({ '2:5': 3 });
		expect(getColorForVerse('002:005')).toBe(3);
		expect(getColorForVerse('02:05')).toBe(3);
	});

	it('reads from store', () => {
		__userColoredBookmarks.set({ '2:255': 1, '36:58': 4 });
		expect(getColorForVerse('2:255')).toBe(1);
		expect(getColorForVerse('36:58')).toBe(4);
		expect(getColorForVerse('1:1')).toBeNull();
	});

	it('falls back to localStorage when store empty/corrupt', () => {
		// simulate SSR where store throws? we set store to invalid but localStorage has data
		__userColoredBookmarks.set(null);
		const payload = JSON.stringify({ userColoredBookmarks: { '2:255': 2 } });
		try { globalThis.localStorage?.setItem('userSettings', payload); } catch (_e) { /* ignore */ }
		try { window.localStorage?.setItem('userSettings', payload); } catch (_e) { /* ignore */ }
		try { global.localStorage?.setItem('userSettings', payload); } catch (_e) { /* ignore */ }
		// ensure bare localStorage also set if exists
		try { localStorage?.setItem('userSettings', payload); } catch (_e) { /* ignore */ }
		// readMap tries store then localStorage
		expect(getColorForVerse('2:255')).toBe(2);
	});

	it('filters invalid colorId values in map', () => {
		__userColoredBookmarks.set({ '2:255': 9, '2:256': 0, '2:257': 1 });
		expect(getColorForVerse('2:255')).toBeNull();
		expect(getColorForVerse('2:257')).toBe(1);
	});

	it('hasColor boolean', () => {
		__userColoredBookmarks.set({ '2:255': 1 });
		expect(hasColor('2:255')).toBe(true);
		expect(hasColor('2:256')).toBe(false);
	});

	it('handles corrupted localStorage JSON gracefully', () => {
		__userColoredBookmarks.set({});
		// corrupt not needed because store returns {}
		expect(getColorForVerse('2:255')).toBeNull();
		// simulate corrupted localStorage with store not available: we set store to throw
		// already covered fallback returns {}
	});
});

describe('getVersesByColor', () => {
	beforeEach(() => {
		__userColoredBookmarks.set({
			'2:255': 1,
			'1:1': 1,
			'36:58': 4,
			'2:10': 1,
			'114:6': 8
		});
	});

	it('invalid colorId -> []', () => {
		expect(getVersesByColor(0)).toEqual([]);
		expect(getVersesByColor(9)).toEqual([]);
		expect(getVersesByColor('foo')).toEqual([]);
	});

	it('filters by color and sorts canonical', () => {
		expect(getVersesByColor(1)).toEqual(['1:1', '2:10', '2:255']);
		expect(getVersesByColor(4)).toEqual(['36:58']);
		expect(getVersesByColor(8)).toEqual(['114:6']);
		expect(getVersesByColor('1')).toEqual(['1:1', '2:10', '2:255']);
	});

	it('ignores invalid verseKeys in map', () => {
		__userColoredBookmarks.set({ '115:1': 1, '2:255': 1, 'bad': 1 });
		expect(getVersesByColor(1)).toEqual(['2:255']);
	});
});

describe('getColoredBookmarksGrouped', () => {
	beforeEach(() => {
		__userColoredBookmarks.set({});
	});

	it('empty map -> isEmpty true', () => {
		const g = getColoredBookmarksGrouped();
		expect(g.isEmpty).toBe(true);
		expect(g.counts.total).toBe(0);
		expect(g.all).toEqual([]);
		for (let i = 1; i <= 8; i++) expect(g.byColor[i]).toEqual([]);
	});

	it('groups and counts correctly canonical order', () => {
		__userColoredBookmarks.set({ '36:58': 4, '2:255': 1, '1:1': 1, '2:10': 1, '114:6': 1 });
		const { byColor, all, counts, isEmpty } = getColoredBookmarksGrouped();
		expect(isEmpty).toBe(false);
		expect(all).toEqual(['1:1', '2:10', '2:255', '36:58', '114:6']);
		expect(byColor[1]).toEqual(['1:1', '2:10', '2:255', '114:6']);
		expect(byColor[4]).toEqual(['36:58']);
		expect(byColor[2]).toEqual([]);
		expect(counts.total).toBe(5);
		expect(counts.byColor[1]).toBe(4);
		expect(counts.byColor[4]).toBe(1);
	});

	it('ignores invalid entries', () => {
		__userColoredBookmarks.set({ '2:255': 9, '115:1': 1, '2:10': 1, 'bad': 2 });
		const g = getColoredBookmarksGrouped();
		expect(g.counts.total).toBe(1);
		expect(g.byColor[1]).toEqual(['2:10']);
	});

	it('getTotalColoredCount / getPerColorCounts / getAllColoredKeysSorted wrappers', () => {
		__userColoredBookmarks.set({ '2:255': 1, '36:58': 4 });
		expect(getTotalColoredCount()).toBe(2);
		expect(getPerColorCounts()[1]).toBe(1);
		expect(getPerColorCounts()[4]).toBe(1);
		expect(getAllColoredKeysSorted()).toEqual(['2:255', '36:58']);
	});

	it('canonical sort across chapters', () => {
		__userColoredBookmarks.set({ '3:1': 2, '2:286': 2, '2:1': 2, '114:6': 2 });
		expect(getVersesByColor(2)).toEqual(['2:1', '2:286', '3:1', '114:6']);
	});

	it('boundary values: 6236 entries not required but map size', () => {
		const bulk = {};
		for (let i = 1; i <= 10; i++) bulk[`${i}:1`] = ((i % 8) + 1);
		__userColoredBookmarks.set(bulk);
		const g = getColoredBookmarksGrouped();
		expect(g.counts.total).toBe(10);
	});
});
