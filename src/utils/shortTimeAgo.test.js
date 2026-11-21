import { describe, expect, test } from 'vitest';
import { shortTimeAgo } from '$utils/shortTimeAgo';

describe('shortTimeAgo', () => {
	const now = new Date(2026, 10, 19, 18, 0).getTime();
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;

	test('shows short relative time up to 7 days', () => {
		expect(shortTimeAgo(now - 20 * 1000, now)).toBe('Just now');
		expect(shortTimeAgo(now - 3 * minute, now)).toBe('3m ago');
		expect(shortTimeAgo(now - 59 * minute, now)).toBe('59m ago');
		expect(shortTimeAgo(now - hour, now)).toBe('1hr ago');
		expect(shortTimeAgo(now - 23 * hour, now)).toBe('23hr ago');
		expect(shortTimeAgo(now - day, now)).toBe('1d ago');
		expect(shortTimeAgo(now - 7 * day - hour, now)).toBe('7d ago');
	});

	test('shows a short date after 7 days, with the year only for past years', () => {
		expect(shortTimeAgo(now - 8 * day, now)).toBe('Nov 11');
		expect(shortTimeAgo(new Date(2025, 4, 12, 9, 0).getTime(), now)).toBe('May 12, 2025');
	});

	test('returns nothing without a timestamp', () => {
		expect(shortTimeAgo(undefined, now)).toBeNull();
	});
});
