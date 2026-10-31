import { writable } from 'svelte/store';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { __audioSettings } from '$utils/stores';

vi.mock('$utils/stores', () => ({
	__reciter: writable(10),
	__translationReciter: writable(1),
	__playbackSpeed: writable(4),
	__audioSettings: writable({}),
	__audioModalVisible: writable(false),
	__currentPage: writable('chapter'),
	__chapterNumber: writable(1),
	__keysToFetch: writable(''),
	__displayType: writable(1),
	__verseWordBlocks: writable({})
}));

vi.mock('$utils/fetchData', () => ({
	fetchAndCacheJson: vi.fn().mockResolvedValue({ data: { 1: { 7: { 10: '0.03|0.75|1.7|2.6|3.6|4.2|5.3|6.3|6.6' } } } })
}));
vi.mock('$utils/offlineModeHandler', () => ({ checkOnlineAndAlert: vi.fn() }));

let wordAudioController;
let player;

// audioController grabs #player at import time, so the element must exist first
beforeAll(async () => {
	player = document.createElement('audio');
	player.id = 'player';
	player.pause = vi.fn();
	player.play = vi.fn();
	player.load = vi.fn();
	document.body.appendChild(player);

	({ wordAudioController } = await import('./audioController'));
});

beforeEach(() => {
	player.currentTime = 12;
	__audioSettings.set({ isPlaying: true, audioType: 'verse', playingKey: '1:7' });
});

test('clicking a word during wbw verse playback seeks to that word, not the next one', async () => {
	await wordAudioController({ key: '1:7:5' });
	expect(player.currentTime).toBe(3.6);

	await wordAudioController({ key: '1:7:1' });
	expect(player.currentTime).toBe(0.03);

	await wordAudioController({ key: '1:7:9' });
	expect(player.currentTime).toBe(6.6);
});

test('clicking a verse end icon during playback does not seek to a word timestamp', async () => {
	await wordAudioController({ key: '1:7', type: 'end' });
	expect(player.currentTime).toBe(0);
});
