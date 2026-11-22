import { describe, expect, test } from 'vitest';
import { describeRange, gameQueryString, isAyahInRange, parseAyahKey, parseAyahRange, resolveWordTranslation } from './guessTheWordOptions';

describe('word-by-word language', () => {
	test('only English and French are offered; anything else falls back to the next candidate, then English', () => {
		expect(resolveWordTranslation('11', 1)).toBe(11);
		expect(resolveWordTranslation('2', 13, 11)).toBe(11);
		expect(resolveWordTranslation('999', 'urdu', null, 5)).toBe(1);
		expect(resolveWordTranslation(null, '', undefined)).toBe(1);
	});
});

describe('ayah range', () => {
	test('accepts only real ayahs', () => {
		expect(parseAyahKey('2:106')).toEqual({ chapter: 2, verse: 106, key: '2:106' });
		expect(parseAyahKey(' 2 : 7 ')?.key).toBe('2:7');
		expect(parseAyahKey('1:8')).toBeNull();
		expect(parseAyahKey('115:1')).toBeNull();
		expect(parseAyahKey('0:1')).toBeNull();
		expect(parseAyahKey('2-106')).toBeNull();
		expect(parseAyahKey(null)).toBeNull();
	});

	test('a range needs both ends, and is put in order when given backwards', () => {
		expect(parseAyahRange('2:205', '2:106')).toMatchObject({ from: { key: '2:106' }, to: { key: '2:205' } });
		expect(parseAyahRange('2:106', null)).toBeNull();
		expect(parseAyahRange('2:106', '2:999')).toBeNull();
	});

	test('membership crosses surah boundaries', () => {
		const range = parseAyahRange('2:280', '3:5');
		expect(isAyahInRange({ chapter: 2, verse: 286 }, range)).toBe(true);
		expect(isAyahInRange({ chapter: 3, verse: 1 }, range)).toBe(true);
		expect(isAyahInRange({ chapter: 3, verse: 6 }, range)).toBe(false);
		expect(isAyahInRange({ chapter: 2, verse: 279 }, range)).toBe(false);
		expect(isAyahInRange({ chapter: 9, verse: 1 }, null)).toBe(true);
	});

	test('settings round-trip through the URL', () => {
		const range = parseAyahRange('2:106', '2:205');
		const query = gameQueryString({ wordTranslation: 2, range });
		expect(query).toBe('lang=2&from=2:106&to=2:205');
		const params = new URLSearchParams(query);
		expect(parseAyahRange(params.get('from'), params.get('to'))).toEqual(range);
		expect(gameQueryString({ wordTranslation: 1, range: null })).toBe('lang=1');
		expect(describeRange(range)).toBe('2:106 – 2:205');
		expect(describeRange(null)).toBe('Whole Quran');
	});
});
