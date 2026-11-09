import { beforeEach, describe, expect, test, vi } from 'vitest';

// The handler keeps session state at module level, so each test gets a fresh copy
let handler;

beforeEach(async () => {
	vi.resetModules();
	handler = await import('$utils/readingHistoryHandler');
});

// Simulates a SvelteKit navigation seen by the layout
function navigate(path) {
	handler.handleReadingNavigation(new URL(`http://localhost${path}`));
}

// Simulates a stable reading position being saved to the history
function read(history, data) {
	return handler.updateReadingHistory({ history, data });
}

describe('reading sessions', () => {
	test('turning mushaf pages keeps updating the same entry', () => {
		navigate('/page?id=10');
		let history = read([], { chapter: 2, verse: 62, currentPage: 'mushaf', page: 10 });

		navigate('/page?id=11');
		history = read(history, { chapter: 2, verse: 70, currentPage: 'mushaf', page: 11 });

		navigate('/page?id=10');
		history = read(history, { chapter: 2, verse: 62, currentPage: 'mushaf', page: 10 });

		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({ chapter: 2, verse: 62, page: 10 });
	});

	test('jumping far away in the mushaf creates a new entry', () => {
		navigate('/page?id=10');
		let history = read([], { chapter: 2, verse: 62, currentPage: 'mushaf', page: 10 });

		navigate('/page?id=400');
		history = read(history, { chapter: 36, verse: 1, currentPage: 'mushaf', page: 400 });

		expect(history.map((entry) => entry.page)).toEqual([400, 10]);
	});

	test('query changes in the same chapter keep the entry, another chapter creates a new one', () => {
		navigate('/2');
		let history = read([], { chapter: 2, verse: 20, currentPage: 'chapter' });

		// "Load previous verses" only changes startVerse
		navigate('/2?startVerse=10');
		history = read(history, { chapter: 2, verse: 12, currentPage: 'chapter' });
		expect(history).toHaveLength(1);

		navigate('/18');
		history = read(history, { chapter: 18, verse: 1, currentPage: 'chapter' });
		expect(history.map((entry) => entry.chapter)).toEqual([18, 2]);
	});

	test('hash verse links in the same chapter keep the entry', () => {
		navigate('/2#20');
		let history = read([], { chapter: 2, verse: 20, currentPage: 'chapter' });

		navigate('/2#255');
		history = read(history, { chapter: 2, verse: 255, currentPage: 'chapter' });

		expect(history).toHaveLength(1);
		expect(handler.getReadingHistoryEntryUrl(history[0])).toBe('/2?startVerse=255');
	});

	test('juz startKey cleanup and next juz keep the entry, leaving the reader starts a new one', () => {
		navigate('/juz?id=2&startKey=2:142');
		navigate('/juz?id=2');
		let history = read([], { chapter: 2, verse: 150, currentPage: 'juz', juz: 2 });

		navigate('/juz?id=3');
		history = read(history, { chapter: 2, verse: 253, currentPage: 'juz', juz: 3 });
		expect(history).toHaveLength(1);

		navigate('/');
		navigate('/juz?id=3');
		history = read(history, { chapter: 2, verse: 260, currentPage: 'juz', juz: 3 });
		expect(history).toHaveLength(2);
	});

	test('page store updates without a URL change do not reset the session', () => {
		navigate('/2');
		let history = read([], { chapter: 2, verse: 5, currentPage: 'chapter' });

		navigate('/2');
		history = read(history, { chapter: 2, verse: 6, currentPage: 'chapter' });

		expect(history).toHaveLength(1);
	});

	test('picking an entry resumes it instead of creating a new one', () => {
		navigate('/2');
		let history = read([], { chapter: 2, verse: 12, currentPage: 'chapter' });
		navigate('/18');
		history = read(history, { chapter: 18, verse: 6, currentPage: 'chapter' });
		navigate('/');

		const baqara = history[1];
		handler.resumeReadingSession(baqara.id, '/2?startVerse=12');
		navigate('/2?startVerse=12');
		history = read(history, { chapter: 2, verse: 17, currentPage: 'chapter' });

		expect(history).toHaveLength(2);
		expect(history[0]).toMatchObject({ id: baqara.id, verse: 17 });
	});

	test('continue reading resumes the latest entry only when it matches the last read chapter', () => {
		navigate('/2');
		let history = read([], { chapter: 2, verse: 257, currentPage: 'chapter' });
		navigate('/');

		handler.resumeLatestReadingSession({ history, lastRead: { chapter: 2, verse: 257 }, targetUrl: '/2?startVerse=256' });
		navigate('/2?startVerse=256');
		history = read(history, { chapter: 2, verse: 258, currentPage: 'chapter' });
		expect(history).toHaveLength(1);

		navigate('/');
		handler.resumeLatestReadingSession({ history, lastRead: { chapter: 3, verse: 1 }, targetUrl: '/3?startVerse=1' });
		navigate('/3?startVerse=1');
		history = read(history, { chapter: 3, verse: 2, currentPage: 'chapter' });
		expect(history).toHaveLength(2);
	});

	test('entry IDs are unique without crypto.randomUUID', () => {
		vi.stubGlobal('crypto', {});

		let history = [];
		for (let i = 1; i <= 20; i++) {
			navigate(`/${i}`);
			history = read(history, { chapter: i, verse: 1, currentPage: 'chapter' });
		}

		expect(new Set(history.map((entry) => entry.id)).size).toBe(20);
		vi.unstubAllGlobals();
	});
});

describe('getReadingHistoryEntryUrl', () => {
	test('reopens each entry in the view it was read in', () => {
		expect(handler.getReadingHistoryEntryUrl({ chapter: 2, verse: 12, currentPage: 'chapter' })).toBe('/2?startVerse=12');
		expect(handler.getReadingHistoryEntryUrl({ chapter: 2, verse: 62, currentPage: 'mushaf', page: 10 })).toBe('/page?id=10');
		expect(handler.getReadingHistoryEntryUrl({ chapter: 2, verse: 150, currentPage: 'juz', juz: 2 })).toBe('/juz?id=2&startKey=2:150');
		expect(handler.getReadingHistoryEntryUrl({ chapter: 2, verse: 30, currentPage: 'hizb', hizb: 1 })).toBe('/hizb?id=1&startKey=2:30');
	});

	test('older entries without a view open in the chapter view', () => {
		expect(handler.getReadingHistoryEntryUrl({ chapter: 18, verse: 6 })).toBe('/18?startVerse=6');
	});
});
