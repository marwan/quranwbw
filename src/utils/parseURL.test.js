// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the store getter so the "current chapter" is always 2 (286 verses)
vi.mock('svelte/store', () => ({ get: () => 2 }));

// Stub the store module, the value is irrelevant because `get` is mocked above
vi.mock('$utils/stores', () => ({ __chapterNumber: {} }));

// Minimal chapter metadata: 1 = 7 verses, 2 = 286 verses, 108 = 3 verses (short chapter)
vi.mock('$data/quranMeta', () => ({
	quranMetaData: { 1: { verses: 7 }, 2: { verses: 286 }, 108: { verses: 3 } }
}));

// Import after the mocks so parseURL picks up the stubbed modules
import { parseURL } from './parseURL';

// Change the jsdom URL without a reload (path, query and hash all work)
function setUrl(path) {
	window.history.pushState({}, '', path);
}

// Run a table of [url, expected [startVerse, endVerse]] cases
function runCases(cases) {
	it.each(cases)('%s', (path, expected) => {
		setUrl(path);
		expect(parseURL()).toEqual(expected);
	});
}

describe('parseURL', () => {
	// Reset to a clean URL so one test's query/hash can't leak into the next
	beforeEach(() => setUrl('/'));

	describe('chapter only (default window)', () => {
		runCases([
			// No verse given: capped to the first 5 verses, not the whole chapter
			['/2', [1, 5]],
			// Empty path falls back to chapter 1 (7 verses), still capped to 5
			['/', [1, 5]],
			// Short chapter (3 verses) is under the cap, so the whole chapter is returned
			['/108', [1, 3]]
			// Out-of-range chapter falls back to the store chapter's verse count, then the cap
			// ['/200', [1, 5]]
		]);
	});

	describe('single verse', () => {
		runCases([
			// Start and end are the same
			['/2/255', [255, 255]],
			// Extra path segments are ignored
			['/2/255/foo', [255, 255]],
			// Trailing slash leaves an empty verse part, which falls back to verse 1
			['/2/', [1, 1]],
			// Verse 0 is invalid, falls back to verse 1
			['/2/0', [1, 1]],
			// Non-numeric verse falls back to verse 1
			['/2/abc', [1, 1]],
			// Verse beyond the chapter end is clamped to the last verse
			['/2/300', [286, 286]],
			// Chapter metadata comes from the URL (chapter 1 = 7 verses), not the store (chapter 2)
			['/1/10', [7, 7]]
		]);
	});

	describe('explicit ranges (exempt from the 5-verse cap)', () => {
		runCases([
			// Each separator in the verse part exercises the /[#.:-]/ split
			['/2/255-256', [255, 256]],
			['/2/255.256', [255, 256]],
			['/2/255:256', [255, 256]],
			// Range at the end of the chapter
			['/2/285-286', [285, 286]],
			// Long explicit range is NOT capped to 5
			['/2/1-286', [1, 286]],
			// End beyond the chapter is clamped to the last verse
			['/1/3-20', [3, 7]],
			// Reversed range: end is raised to match start
			['/2/10-3', [10, 10]],
			// Dangling separator has no end verse, so it behaves like a single verse
			['/2/255-', [255, 255]]
		]);
	});

	describe('?startVerse= param', () => {
		runCases([
			// Param overrides the path verse and collapses to one verse
			['/2/255?startVerse=10', [10, 10]],
			// Param works on a chapter-only URL
			['/2?startVerse=10', [10, 10]],
			// Param overrides an explicit range too
			['/2/255-260?startVerse=10', [10, 10]],
			// Param beyond the chapter end is clamped
			['/2?startVerse=999', [286, 286]],
			// Non-numeric param is ignored
			['/2?startVerse=abc', [1, 5]]
		]);
	});

	describe('#hash', () => {
		runCases([
			// Hash on a chapter-only URL
			['/2#255', [255, 255]],
			// Hash overrides the path verse and collapses to one verse
			['/2/255#7', [7, 7]],
			// Hash wins over ?startVerse=
			['/2?startVerse=10#20', [20, 20]],
			// Hash beyond the chapter end is clamped
			['/2#999', [286, 286]],
			// Non-numeric hash is ignored
			['/2#abc', [1, 5]]
		]);
	});

	describe('chapter separators (not handled by parseURL)', () => {
		// The header comment lists these, but parseURL splits the path on "/" only, so it sees
		// "2-255" etc. as a chapter-only path. The site handles these elsewhere (route/redirect)
		runCases([
			['/2-255', [1, 5]],
			['/2:255', [1, 5]],
			['/2.255', [1, 5]]
		]);
	});
});
