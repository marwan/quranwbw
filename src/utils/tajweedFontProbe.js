// Pixel checks for the Mushaf Tajweed color fonts (framework free, also used by debug/font-matrix).
//
// Measured on real iPhones (BrowserStack, Safari iOS 14 → 27):
// - COLRv1 is BLANK on iOS 17.0–17.1: canvas fillText() draws nothing either, so a canvas check sees it.
// - COLRv1 colors BLEED on iOS 18.0–18.3 and 26.2–26.3 (whole words take the tajweed color). Canvas fillText()
//   is still correct, but the same text laid out as HTML inside an <svg><foreignObject> image reproduces the
//   bleed: its colored/ink share is ~2.5× the canvas one (1.0× everywhere else).
// - OT-SVG is BLANK on iOS 18.0–18.3 inside a foreignObject image too (detectable). On iOS 17.5 and 27 it is blank
//   in the page only, which no JavaScript check can see.
//
// The check draws lines 10 and 11 of Mushaf page 2 (end of 2:1 to the start of 2:3), INCLUDING the verse-end ornaments:
// the bleeding comes from the color of a multi-colored glyph leaking into the next words, so a text without an ornament
// (e.g. verse 2:4 alone) does not reproduce it (verified on iOS 18.0.1 and 26.3).
// The bleeding also depends on the rendered glyph size (page zoom triggers it on iOS 17.5), so both lines are drawn
// in several bands of different font sizes, in ONE canvas and ONE SVG image to keep the cost of a single check.

const codepoints = (...groups) => groups.map((group) => group.map((code) => String.fromCharCode(code)).join('')).join(' ');
const PROBE_LINES = [codepoints([0xfc41], [0xfc42], [0xfc43], [0xfc44], [0xfc45], [0xfc46, 0xfc47], [0xfc48, 0xfc49], [0xfc4a]), codepoints([0xfc4b], [0xfc4c], [0xfc4d], [0xfc4e], [0xfc4f], [0xfc50], [0xfc51])];

const WIDTH = 720;
const FONT_SIZES = [14, 16, 18, 20, 20.4, 21, 21.6, 22, 24, 28, 32, 36];

// One band per font size: two lines of text, each band starting at the same y in the canvas and in the SVG image
const BANDS = FONT_SIZES.reduce((bands, size) => {
	const lineHeight = Math.ceil(size * 1.8);
	const previous = bands[bands.length - 1];
	bands.push({ size, lineHeight, y: previous ? previous.y + previous.height : 0, height: lineHeight * 2 + 8 });
	return bands;
}, []);
const HEIGHT = BANDS[BANDS.length - 1].y + BANDS[BANDS.length - 1].height;

// A colored share this many times above the normal one (or the canvas one) means colors are bleeding (measured: 1.00 vs 2.51)
const BLEED_RATIO = 1.6;

// Counts, per band, the pixels that differ from the grey background (ink) and, among them, the colored ones.
// A grey background (instead of white) keeps white or transparent glyph paint distinguishable.
function countBands(data) {
	return BANDS.map(({ y, height }) => {
		let ink = 0;
		let colored = 0;
		for (let i = y * WIDTH * 4; i < (y + height) * WIDTH * 4; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (Math.abs(r - 128) + Math.abs(g - 128) + Math.abs(b - 128) > 30) {
				ink++;
				if (Math.max(r, g, b) - Math.min(r, g, b) > 30) colored++;
			}
		}
		return { ink, colored, coloredShare: ink ? colored / ink : 0 };
	});
}

function total(bands) {
	const ink = bands.reduce((sum, band) => sum + band.ink, 0);
	const colored = bands.reduce((sum, band) => sum + band.colored, 0);
	return { ink, colored, coloredShare: ink ? colored / ink : 0 };
}

function median(values) {
	const sorted = values.slice().sort((a, b) => a - b);
	return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

function greyCanvas() {
	const canvas = document.createElement('canvas');
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	const context = canvas.getContext('2d', { willReadFrequently: true });
	context.fillStyle = 'rgb(128,128,128)';
	context.fillRect(0, 0, WIDTH, HEIGHT);
	return context;
}

function toBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
	return btoa(binary);
}

async function fetchFont(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Font request failed (${response.status})`);
	return response.arrayBuffer();
}

// Draws every band with canvas fillText() using a font registered under a throwaway family name
async function canvasProbe(buffer, family) {
	const font = new FontFace(family, buffer);
	await font.load();
	document.fonts.add(font);
	try {
		const context = greyCanvas();
		context.fillStyle = '#000';
		context.textAlign = 'right';
		BANDS.forEach(({ size, lineHeight, y }) => {
			context.font = `${size}px "${family}"`;
			PROBE_LINES.forEach((line, row) => context.fillText(line, WIDTH - 10, y + row * lineHeight + lineHeight * 0.72));
		});
		return countBands(context.getImageData(0, 0, WIDTH, HEIGHT).data);
	} finally {
		document.fonts.delete(font);
	}
}

// Lays every band out as HTML inside one SVG image (font embedded as a data: URI), then reads it back.
// Returns null when the browser cannot render or read it back, so the caller can ignore this check.
function foreignObjectProbe(buffer) {
	const blocks = BANDS.map(({ size, lineHeight, height }) => `<div style="height:${height}px;overflow:hidden;font:${size}px/${lineHeight}px probe;color:#000;white-space:pre;padding:0 10px;text-align:right;direction:rtl">${PROBE_LINES.join('<br/>')}</div>`).join('');
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` + `<style>@font-face{font-family:"probe";src:url(data:font/woff2;base64,${toBase64(buffer)})}</style>` + `<foreignObject x="0" y="0" width="${WIDTH}" height="${HEIGHT}">` + `<div xmlns="http://www.w3.org/1999/xhtml">${blocks}</div>` + `</foreignObject></svg>`;

	return new Promise((resolve) => {
		const image = new Image();
		const timeout = setTimeout(() => resolve(null), 8000);
		image.onload = () => {
			clearTimeout(timeout);
			// one more tick so the image document finishes decoding the embedded font
			setTimeout(() => {
				try {
					const context = greyCanvas();
					context.drawImage(image, 0, 0);
					resolve(countBands(context.getImageData(0, 0, WIDTH, HEIGHT).data));
				} catch {
					resolve(null);
				}
			}, 150);
		};
		image.onerror = () => {
			clearTimeout(timeout);
			resolve(null);
		};
		image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}

// Returns { state: 'ok' | 'blank' | 'bleed', ... } for a COLRv1 font file, with per-size measurements and timings (ms).
// Bleeding = in any band, the foreignObject colored share is > BLEED_RATIO × the canvas one, or any band (canvas or
// foreignObject) is > BLEED_RATIO × the normal colored share (median of the canvas bands).
export async function probeCOLRv1(url) {
	const timings = {};
	let start = performance.now();
	const buffer = await fetchFont(url);
	timings.fetch = Math.round(performance.now() - start);

	start = performance.now();
	const canvasBands = await canvasProbe(buffer, 'tajweed-probe-colrv1');
	timings.canvas = Math.round(performance.now() - start);
	const canvas = total(canvasBands);
	if (canvas.ink === 0) return { state: 'blank', canvas, foreignObject: null, ratio: null, bands: null, timings };

	start = performance.now();
	const foBands = await foreignObjectProbe(buffer);
	timings.foreignObject = Math.round(performance.now() - start);

	const normalShare = median(canvasBands.filter((band) => band.ink > 0).map((band) => band.coloredShare));
	const bands = BANDS.map(({ size }, i) => {
		const canvasBand = canvasBands[i];
		const foBand = foBands ? foBands[i] : null;
		const ratios = [normalShare ? canvasBand.coloredShare / normalShare : 0];
		if (foBand && foBand.ink) {
			ratios.push(normalShare ? foBand.coloredShare / normalShare : 0);
			if (canvasBand.coloredShare) ratios.push(foBand.coloredShare / canvasBand.coloredShare);
		}
		return { size, canvasShare: canvasBand.coloredShare, foShare: foBand ? foBand.coloredShare : null, foInk: foBand ? foBand.ink : null, ratio: Math.max(...ratios) };
	});
	const ratio = Math.max(...bands.map((band) => band.ratio));
	return { state: ratio > BLEED_RATIO ? 'bleed' : 'ok', canvas, foreignObject: foBands ? total(foBands) : null, ratio, normalShare, bands, timings };
}

// Returns { state: 'ok' | 'blank', ... } for an OT-SVG font file ('ok' when the check cannot run), with timings (ms)
export async function probeOTSVG(url) {
	const timings = {};
	let start = performance.now();
	const buffer = await fetchFont(url);
	timings.fetch = Math.round(performance.now() - start);

	start = performance.now();
	const foBands = await foreignObjectProbe(buffer);
	timings.foreignObject = Math.round(performance.now() - start);
	const foreignObject = foBands ? total(foBands) : null;
	return { state: foreignObject && foreignObject.ink === 0 ? 'blank' : 'ok', foreignObject, bands: foBands, timings };
}
