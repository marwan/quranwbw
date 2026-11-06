import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { loadFont } from './loadFont';

// jsdom has no FontFace API: a minimal stand-in that records what was added to document.fonts
class FakeFontFace {
	constructor(family, source) {
		this.family = family;
		this.source = source;
	}
	load() {
		return Promise.resolve(this);
	}
}

const fontSet = new Set();

beforeEach(() => {
	vi.stubGlobal('FontFace', FakeFontFace);
	Object.defineProperty(document, 'fonts', { value: fontSet, configurable: true });
});

afterEach(() => {
	vi.unstubAllGlobals();
	fontSet.clear();
});

describe('loadFont', () => {
	test('loads a font once per name and URL', async () => {
		const first = loadFont('p10', 'https://cdn/COLRv1/p10.woff2');
		expect(loadFont('p10', 'https://cdn/COLRv1/p10.woff2')).toBe(first);
		await first;
		expect([...fontSet].map((font) => font.source)).toEqual(['url(https://cdn/COLRv1/p10.woff2)']);
	});

	test('replaces the face of a name loaded again from another URL', async () => {
		await loadFont('p20', 'https://cdn/COLRv1/p20.woff2');
		await loadFont('p20', 'https://cdn/OT-SVG-LIGHT/p20.woff2');
		expect([...fontSet].map((font) => [font.family, font.source])).toEqual([['p20', 'url(https://cdn/OT-SVG-LIGHT/p20.woff2)']]);
	});

	test('keeps the previous face when the replacement fails to load, and can retry it', async () => {
		await loadFont('p30', 'https://cdn/COLRv1/p30.woff2');
		const failing = vi.spyOn(FakeFontFace.prototype, 'load').mockImplementationOnce(() => Promise.reject(new Error('network')));
		await expect(loadFont('p30', 'https://cdn/OT-SVG-LIGHT/p30.woff2')).rejects.toBeUndefined();
		failing.mockRestore();
		expect([...fontSet].map((font) => font.source)).toEqual(['url(https://cdn/COLRv1/p30.woff2)']);
		await loadFont('p30', 'https://cdn/OT-SVG-LIGHT/p30.woff2');
		expect([...fontSet].map((font) => font.source)).toEqual(['url(https://cdn/OT-SVG-LIGHT/p30.woff2)']);
	});

	test('a replacement requested while another one is loading still removes the installed face', async () => {
		await loadFont('p40', 'https://cdn/COLRv1/p40.woff2');

		// loads that finish only when the test says so
		const pending = {};
		const deferredLoad = vi.spyOn(FakeFontFace.prototype, 'load').mockImplementation(function () {
			return new Promise((resolve) => (pending[this.source] = () => resolve(this)));
		});
		const toOTSVG = loadFont('p40', 'https://cdn/OT-SVG-LIGHT/p40.woff2');
		const backToCOLRv1 = loadFont('p40', 'https://cdn/COLRv1/p40.woff2?again');

		// the abandoned OT-SVG load finishes first, then the latest COLRv1 one
		pending['url(https://cdn/OT-SVG-LIGHT/p40.woff2)']();
		await toOTSVG;
		pending['url(https://cdn/COLRv1/p40.woff2?again)']();
		await backToCOLRv1;
		deferredLoad.mockRestore();

		expect([...fontSet].map((font) => font.source)).toEqual(['url(https://cdn/COLRv1/p40.woff2?again)']);
	});
});
