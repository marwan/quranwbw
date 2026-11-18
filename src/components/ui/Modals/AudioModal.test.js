import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { get, writable } from 'svelte/store';
import { beforeEach, expect, test, vi } from 'vitest';
import AudioModal from './AudioModal.svelte';
import { __audioModalVisible, __audioSettings, __chapterNumber, __currentPage } from '$utils/stores';

vi.mock('$utils/stores', () => ({
	__audioModalVisible: writable(false),
	__audioSettings: writable({}),
	__chapterNumber: writable(1),
	__currentPage: writable('chapter'),
	__displayType: writable(1),
	__englishTerminology: writable(false),
	__keysToFetch: writable(''),
	__playbackSpeed: writable(4),
	__reciter: writable(10),
	__translationReciter: writable(1),
	__verseWordBlocks: writable({})
}));

vi.mock('$src/hooks.client', () => ({ defaultSettings: { audioSettings: {} } }));
vi.mock('$utils/updateSettings', () => ({ updateSettings: vi.fn() }));
vi.mock('$utils/fetchData', () => ({ fetchAndCacheJson: vi.fn() }));
vi.mock('$utils/offlineModeHandler', () => ({ checkOnlineAndAlert: vi.fn() }));

beforeEach(() => {
	window.matchMedia = (media) => ({
		matches: false,
		media,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	});
	__currentPage.set('chapter');
	__chapterNumber.set(1);
	__audioSettings.set({
		playingKey: '1:1',
		playingChapter: 1,
		playingVerse: 1,
		startVerse: 1,
		endVerse: 7,
		audioType: 'verse',
		audioRange: 'playRange',
		language: 'arabic',
		repeatType: 'repeatVerse',
		timesToRepeat: 1,
		audioDelay: 1,
		rememberSettings: false
	});
	__audioModalVisible.set(true);
	window.versesToPlayArray = [];
});

test('selecting Till updates the button and the verses to play', async () => {
	render(AudioModal);
	const range = within(document.querySelector('#audio-range-options'));

	await fireEvent.click(range.getByRole('button', { name: 'Ayah 7' }));
	await fireEvent.click(await screen.findByRole('button', { name: 'Ayah 5' }));

	expect(range.getByRole('button', { name: 'Ayah 5' })).toBeTruthy();
	expect(get(__audioSettings).endVerse).toBe(5);
	expect(window.versesToPlayArray).toEqual(['1:1', '1:2', '1:3', '1:4', '1:5']);
});
