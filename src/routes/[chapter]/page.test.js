import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture redirects instead of navigating
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

// Stub browser-only modules pulled in by validateKey, isValidVerseKey doesn't use them
vi.mock('$utils/stores', () => ({ __currentPage: {}, __chapterNumber: {} }));
vi.mock('$utils/fetchData', () => ({ fetchAndCacheJson: vi.fn() }));

import { goto } from '$app/navigation';
import { load } from './+page.js';

// Run the route loader and ignore the 404 it throws after redirecting a verse key
async function runLoad(chapter) {
	try {
		await load({ params: { chapter } });
	} catch {
		// Expected for verse keys: goto() is fired, then the chapter number check fails
	}
}

describe('[chapter] route verse key redirect', () => {
	beforeEach(() => goto.mockClear());

	it.each([
		// Single verse with each separator
		['2-255', '/2/255'],
		['2:255', '/2/255'],
		['2.255', '/2/255'],
		// Ranges keep their end verse so parseURL receives them
		['2-255-260', '/2/255-260'],
		['2:255-260', '/2/255-260'],
		['2.255.260', '/2/255-260'],
		// Non-numeric or empty end verse is dropped
		['2-255-', '/2/255'],
		['2-255-abc', '/2/255']
	])('%s redirects to %s', async (param, expected) => {
		await runLoad(param);
		expect(goto).toHaveBeenCalledWith(expected, { replaceState: false });
	});

	it.each([
		// Invalid start verse: no verse redirect
		['2-999-1000'],
		['200-1-2']
	])('%s does not redirect to a verse', async (param) => {
		await runLoad(param);
		expect(goto).not.toHaveBeenCalled();
	});
});
