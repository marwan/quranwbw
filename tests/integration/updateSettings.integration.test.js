import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// ensure localStorage polyfill early - will be set in setup.js
function ls() {
	return globalThis.localStorage || (typeof window !== 'undefined' ? window.localStorage : undefined) || (typeof global !== 'undefined' ? global.localStorage : undefined);
}

describe('updateSettings — userColoredBookmarks integration', () => {
	let updateSettings;
	let stores;
	let defaultSettings;
	let setUserSettings;
	let getVerseTintWrapperClasses;

	beforeEach(async () => {
		ls()?.clear();
		// dynamic imports after setup polyfills
		const hooks = await import('../../src/hooks.client.js');
		defaultSettings = hooks.defaultSettings;
		setUserSettings = hooks.setUserSettings;
		ls()?.clear();
		setUserSettings(defaultSettings);
		stores = await import('$utils/stores.js');
		// re-sync store from fresh localStorage
		const fresh = JSON.parse(ls().getItem('userSettings'));
		stores.__userColoredBookmarks.set(fresh.userColoredBookmarks ?? {});
		const mod = await import('$utils/updateSettings.js');
		updateSettings = mod.updateSettings;
		const cb = await import('$utils/coloredBookmarks.js');
		getVerseTintWrapperClasses = cb.getVerseTintWrapperClasses;
		window.umami = { track: vi.fn() };
	});

	it('AC2: set color persists and returns 200, store syncs', () => {
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		expect(res.ok).toBe(true);
		expect(res.status).toBe(200);
		expect(res.action).toBe('set');
		expect(res.totalColored).toBe(1);
		const map = get(stores.__userColoredBookmarks);
		expect(map['2:255']).toBe(1);
		const raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.userColoredBookmarks['2:255']).toBe(1);
		expect(raw.userBookmarks).toEqual([]);
	});

	it('AC2: normalization leading zeros + alias', () => {
		let res = updateSettings({ type: 'userColoredBookmarks', key: '002:005', color: 'amber' });
		expect(res.ok).toBe(true);
		expect(res.status).toBe(200);
		let raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.userColoredBookmarks['2:5']).toBe(1);
		res = updateSettings({ type: 'userColoredBookmarks', key: '36:58', color: 'lavender' });
		expect(res.ok).toBe(true);
		expect(JSON.parse(ls().getItem('userSettings')).userColoredBookmarks['36:58']).toBe(4);
	});

	it('idempotency: same color -> 204 noop no write', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 2 });
		window.umami.track.mockClear();
		const before = ls().getItem('userSettings');
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 2 });
		expect(res.status).toBe(204);
		expect(res.action).toBe('noop');
		expect(ls().getItem('userSettings')).toBe(before);
		expect(window.umami.track).not.toHaveBeenCalled();
	});

	it('replace: different color overwrites and tracks Change', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		window.umami.track.mockClear();
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 3 });
		expect(res.status).toBe(200);
		expect(res.action).toBe('replace');
		expect(get(stores.__userColoredBookmarks)['2:255']).toBe(3);
		expect(window.umami.track).toHaveBeenCalledWith(expect.stringContaining('Change'), expect.any(Object));
	});

	it('clear removes color only, bookmarks untouched', () => {
		updateSettings({ type: 'userBookmarks', key: '2:255' });
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 5 });
		let raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.userBookmarks).toContain('2:255');
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', clear: true });
		expect(res.status).toBe(200);
		expect(res.action).toBe('clear');
		raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.userColoredBookmarks['2:255']).toBeUndefined();
		expect(raw.userBookmarks).toContain('2:255');
	});

	it('clear on absent -> 204 noop', () => {
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', clear: true });
		expect(res.status).toBe(204);
		expect(res.action).toBe('noop');
	});

	it('validation: missing key -> 400', () => {
		const res = updateSettings({ type: 'userColoredBookmarks', colorId: 1 });
		expect(res.status).toBe(400);
		expect(res.ok).toBe(false);
		expect(res.error.code).toBe('VALIDATION_ERROR');
	});

	it('validation: invalid verseKey -> 400', () => {
		expect(updateSettings({ type: 'userColoredBookmarks', key: '115:1', colorId: 1 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:300', colorId: 1 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '', colorId: 1 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '  ', colorId: 1 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '__proto__', colorId: 1 }).status).toBe(400);
	});

	it('validation: invalid colorId -> 400', () => {
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 0 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 9 }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 'foo' }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:255', color: 'unknownColor' }).status).toBe(400);
		expect(updateSettings({ type: 'userColoredBookmarks', key: '2:255' }).status).toBe(400);
	});

	it('bulk override atomic success', () => {
		const res = updateSettings({ type: 'userColoredBookmarks', override: { '1:1': 1, '2:255': 3, '36:58': 5 } });
		expect(res.status).toBe(200);
		expect(res.totalColored).toBe(3);
		const raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.userColoredBookmarks).toEqual({ '1:1': 1, '2:255': 3, '36:58': 5 });
	});

	it('bulk override atomic reject on any invalid entry', () => {
		updateSettings({ type: 'userColoredBookmarks', override: { '1:1': 1 } });
		const before = JSON.parse(ls().getItem('userSettings')).userColoredBookmarks;
		const res = updateSettings({ type: 'userColoredBookmarks', override: { '1:1': 1, '115:1': 2 } });
		expect(res.status).toBe(400);
		expect(JSON.parse(ls().getItem('userSettings')).userColoredBookmarks).toEqual(before);
	});

	it('bulk override rejects __proto__ pollution', () => {
		// Use JSON.parse to ensure __proto__ as own property, not prototype
		const payload = JSON.parse('{"__proto__":1, "1:1":1}');
		const res = updateSettings({ type: 'userColoredBookmarks', override: payload });
		expect(res.status).toBe(400);
		// Also test constructor pollution reliably
		const res2 = updateSettings({ type: 'userColoredBookmarks', override: { 'constructor': 1, '1:1': 1 } });
		expect(res2.status).toBe(400);
	});

	it('quota error reverts snapshot and returns 507', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '1:1', colorId: 1 });
		const snapshot = JSON.parse(JSON.stringify(get(stores.__userColoredBookmarks)));
		const orig = ls().setItem;
		ls().setItem = vi.fn(() => {
			const e = new DOMException('Quota exceeded', 'QuotaExceededError');
			// code is getter-only in some engines, rely on name check in isQuotaError
			throw e;
		});
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 2 });
		expect(res.status).toBe(507);
		expect(res.error.code).toBe('QUOTA_EXCEEDED');
		expect(get(stores.__userColoredBookmarks)).toEqual(snapshot);
		ls().setItem = orig;
	});

	it('persistence survives reload: set + re-init via setUserSettings additive', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		updateSettings({ type: 'userColoredBookmarks', key: '36:58', colorId: 4 });
		const stored = ls().getItem('userSettings');
		setUserSettings(defaultSettings);
		const after = JSON.parse(ls().getItem('userSettings'));
		expect(after.userColoredBookmarks['2:255']).toBe(1);
		expect(after.userColoredBookmarks['36:58']).toBe(4);
		expect(typeof stored).toBe('string');
	});

	it('migration safe for old userBookmarks array', () => {
		ls().clear();
		ls().setItem('userSettings', JSON.stringify({ userBookmarks: ['2:255'], userNotes: {}, custom: 'keep' }));
		setUserSettings(defaultSettings);
		const parsed = JSON.parse(ls().getItem('userSettings'));
		expect(parsed.userBookmarks).toEqual(['2:255']);
		expect(parsed.userColoredBookmarks).toEqual({});
		expect(parsed.custom).toBe('keep');
	});

	it('store -> wrapper tint integration: getVerseTintWrapperClasses uses stored color', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		const cid = get(stores.__userColoredBookmarks)['2:255'];
		expect(getVerseTintWrapperClasses(cid, 1, false)).toContain('bg-[');
	});

	it('wrapper tint picks dark vs light correctly', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		const cid = get(stores.__userColoredBookmarks)['2:255'];
		expect(getVerseTintWrapperClasses(cid, 1, false)).toBe('bg-[#EADDB8]/28 rounded-xl transition-colors duration-200');
		expect(getVerseTintWrapperClasses(cid, 5, false)).toBe('bg-[#B9973F]/34 rounded-xl transition-colors duration-200');
		expect(getVerseTintWrapperClasses(cid, 5, true)).toContain('box-decoration-clone');
	});

	it('homepage grouping derived from store (canonical order)', () => {
		updateSettings({ type: 'userColoredBookmarks', key: '36:58', colorId: 4 });
		updateSettings({ type: 'userColoredBookmarks', key: '1:1', colorId: 1 });
		updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		const map = get(stores.__userColoredBookmarks);
		expect(map['1:1']).toBe(1);
		const byColor = { 1: [], 4: [] };
		for (const [k, v] of Object.entries(map)) {
			if (v === 1) byColor[1].push(k);
			if (v === 4) byColor[4].push(k);
		}
		byColor[1].sort((a, b) => {
			const [ca, va] = a.split(':').map(Number);
			const [cb, vb] = b.split(':').map(Number);
			return ca !== cb ? ca - cb : va - vb;
		});
		expect(byColor[1]).toEqual(['1:1', '2:255']);
		expect(byColor[4]).toEqual(['36:58']);
	});

	it('extrasActiveTab 4 persists', () => {
		const res = updateSettings({ type: 'homepageLayoutPreferences', value: { extrasPanelVisible: true, divisionsActiveTab: 1, extrasActiveTab: 4, chaptersSortIsAscending: true, juzSortIsAscending: true, hizbSortIsAscending: true } });
		expect(res.ok).toBe(true);
		const raw = JSON.parse(ls().getItem('userSettings'));
		expect(raw.displaySettings.homepageLayoutPreferences.extrasActiveTab).toBe(4);
	});

	it('empty/boundary: handles invalid JSON in localStorage gracefully via setUserSettings', () => {
		ls().setItem('userSettings', JSON.stringify({ userColoredBookmarks: [], userBookmarks: [] }));
		const res = updateSettings({ type: 'userColoredBookmarks', key: '2:255', colorId: 1 });
		expect(res.ok).toBe(true);
		expect(JSON.parse(ls().getItem('userSettings')).userColoredBookmarks['2:255']).toBe(1);
	});
});
