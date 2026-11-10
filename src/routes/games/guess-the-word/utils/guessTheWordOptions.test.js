import { describe, expect, test } from 'vitest';
import { describeRange, gameQueryString, isAyahInRange, parseAyahKey, parseAyahRange, resolveWordTranslation } from './guessTheWordOptions';
import { advanceWord, askableIndexes, createAyahSession, isLastAskableWord, recordWordOutcome, startNextAyah, upcomingAyah } from './guessTheWordSet';

describe('word-by-word language', () => {
	test('uses the first known language id, falling back to English', () => {
		expect(resolveWordTranslation('2', 5, 1)).toBe(2);
		expect(resolveWordTranslation('999', 'urdu', null, 11)).toBe(11);
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

describe('words without a meaning', () => {
	test('are skipped: play starts at, steps through and ends on askable words only', () => {
		const word = (key, askable = true) => ({ word_key: key, askable });
		const ayah = { key: '2:5', chapter: 2, verse: 5, words: [word('2:5:1', false), word('2:5:2'), word('2:5:3', false), word('2:5:4'), word('2:5:5', false)] };
		let session = createAyahSession([ayah], () => 0, { ordered: true });
		const asked = [];
		while (!session.isComplete) {
			asked.push(session.deck[0].words[session.wordIndex].word_key);
			session = advanceWord(recordWordOutcome(session, 'correct'));
		}
		expect(asked).toEqual(['2:5:2', '2:5:4']);
		expect(askableIndexes(ayah)).toEqual([1, 3]);
		expect(isLastAskableWord({ deck: [ayah], ayahIndex: 0, wordIndex: 3 })).toBe(true);
		expect(isLastAskableWord({ deck: [ayah], ayahIndex: 0, wordIndex: 1 })).toBe(false);
	});
});

describe('ordered sessions', () => {
	const ayah = (key) => ({ key, chapter: +key.split(':')[0], verse: +key.split(':')[1], words: [{ word_key: key + ':1' }] });
	const ayahs = ['2:106', '2:107', '2:108'].map(ayah);

	test('a range is played in order and starts over after the last ayah', () => {
		let session = createAyahSession(ayahs, () => 0, { ordered: true });
		const played = [];
		for (let index = 0; index < 4; index++) {
			played.push(session.deck[session.ayahIndex].key);
			session = startNextAyah({ ...session, isComplete: true });
		}
		expect(played).toEqual(['2:106', '2:107', '2:108', '2:106']);
	});

	test('the upcoming ayah wraps around for a range but is unknown at the end of a shuffled deck', () => {
		const ordered = createAyahSession(ayahs, () => 0, { ordered: true });
		expect(upcomingAyah({ ...ordered, ayahIndex: 2 }).key).toBe('2:106');
		const shuffled = createAyahSession(ayahs, () => 0);
		expect(upcomingAyah({ ...shuffled, ayahIndex: 2 })).toBeNull();
		expect(upcomingAyah(createAyahSession([ayah('1:1')], () => 0, { ordered: true }))).toBeNull();
	});
});
