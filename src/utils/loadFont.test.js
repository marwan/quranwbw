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
});
