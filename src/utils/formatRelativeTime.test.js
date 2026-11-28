import { describe, expect, test } from 'vitest';
import { formatRelativeTime } from '$utils/formatRelativeTime';

describe('formatRelativeTime', () => {
	const now = new Date(2026, 10, 19, 18, 0).getTime();
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;

	test('shows short relative time up to 7 days', () => {
		expect(formatRelativeTime(now - 20 * 1000, now)).toBe('Just now');
		expect(formatRelativeTime(now - 3 * minute, now)).toBe('3m ago');
		expect(formatRelativeTime(now - 59 * minute, now)).toBe('59m ago');
		expect(formatRelativeTime(now - hour, now)).toBe('1hr ago');
		expect(formatRelativeTime(now - 23 * hour, now)).toBe('23hr ago');
		expect(formatRelativeTime(now - day, now)).toBe('1d ago');
		expect(formatRelativeTime(now - 7 * day - hour, now)).toBe('7d ago');
	});

	test('shows a short date after 7 days, with the year only for past years', () => {
		expect(formatRelativeTime(now - 8 * day, now)).toBe('Nov 11');
		expect(formatRelativeTime(new Date(2025, 4, 12, 9, 0).getTime(), now)).toBe('May 12, 2025');
	});

	// Regression: notes store modified_at as a date string, which used to fall through to the date branch
	test('accepts ISO date strings', () => {
		expect(formatRelativeTime(new Date(now - 20 * 1000).toISOString(), now)).toBe('Just now');
		expect(formatRelativeTime(new Date(now - 3 * minute).toISOString(), now)).toBe('3m ago');
		expect(formatRelativeTime(new Date(now - 2 * day).toISOString(), now)).toBe('2d ago');
		expect(formatRelativeTime(new Date(2025, 4, 12, 9, 0).toISOString(), now)).toBe('May 12, 2025');
	});

	test('accepts Date objects', () => {
		expect(formatRelativeTime(new Date(now - 3 * minute), now)).toBe('3m ago');
	});

	// NotesModal calls it without `now`, so the default must work for a just-saved note
	test('uses the current time by default', () => {
		expect(formatRelativeTime(Date.now())).toBe('Just now');
		expect(formatRelativeTime(new Date().toISOString())).toBe('Just now');
	});

	test('treats timestamps slightly in the future (clock skew) as just now', () => {
		expect(formatRelativeTime(now + 30 * 1000, now)).toBe('Just now');
	});

	test('returns nothing for missing or invalid timestamps', () => {
		expect(formatRelativeTime(undefined, now)).toBeNull();
		expect(formatRelativeTime(null, now)).toBeNull();
		expect(formatRelativeTime('', now)).toBeNull();
		expect(formatRelativeTime('not a date', now)).toBeNull();
	});
});
