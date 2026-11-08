import { staticEndpoint } from '$data/websiteSettings';
import { bismillahFontMap } from '$data/bismillahFontMap';
import { isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';

// Loads a font by name and URL, adding it to the browser's FontFace API.
// Uses a module-level cache to deduplicate requests — if the same font is
// requested by multiple word instances simultaneously (which happens on every
// verse render), they all receive the same in-flight promise rather than
// triggering duplicate network requests. On failure, the cache entry is removed
// so the load can be retried.
const fontCache = new Map();

export function loadFont(name, url) {
	// Font is already loaded or currently loading — return the cached promise
	if (fontCache.has(name)) {
		return fontCache.get(name);
	}

	// First time loading this font — create and cache the promise
	const promise = new Promise((resolve, reject) => {
		const myFont = new FontFace(name, `url(${url})`);
		myFont
			.load()
			.then(() => {
				document.fonts.add(myFont);
				resolve();
			})
			.catch((error) => {
				fontCache.delete(name); // remove on failure so it can be retried
				reject(error instanceof Error ? error : new Error(`Failed to load font: ${name}`));
			});
	});

	fontCache.set(name, promise);
	return promise;
}

// Cache of downloaded bismillah fonts, keyed by URL, so the same file is never downloaded twice
const bismillahFontCache = new Map();

// The URL requested last, only that font is allowed to be registered as "bismillah"
let latestBismillahUrl = null;

// Returns the CDN URL of the bismillah font for the given font type
export function getBismillahFontUrl(fontType) {
	// Fall back to the Tajweed COLOR font if the font type isn't in the map
	const defaultBismillah = bismillahFontMap[3].file;

	let { file: fileName, version: fontVersion } = {
		file: defaultBismillah,
		version: 13
	};

	// Override with the mapped values when available
	if (bismillahFontMap[fontType]) {
		({ file: fileName, version: fontVersion } = bismillahFontMap[fontType]);
	}

	// Font type 3 (Tajweed COLOR) needs a different file in Firefox dark mode
	if (fontType === 3) {
		fileName = isFirefoxDarkTajweed() ? bismillahFontMap.firefoxDarkTajweed.file : defaultBismillah;
		fontVersion = 13;
	}

	return `${staticEndpoint}/fonts/Extras/bismillah/${fileName}.woff2?version=${fontVersion}`;
}

// Downloads the font, and retries once if the first attempt fails
function downloadBismillahFont(url) {
	const attempt = () => new FontFace('bismillah', `url(${url})`).load();
	return attempt().catch(attempt);
}

// Loads the bismillah font for the given font type and registers it under the "bismillah" family.
// Resolves once the font is ready to use, rejects if the download fails twice.
export function loadBismillahFont(fontType) {
	const url = getBismillahFontUrl(fontType);
	latestBismillahUrl = url;

	if (!bismillahFontCache.has(url)) {
		const promise = downloadBismillahFont(url).catch((error) => {
			// remove on failure so it can be retried
			bismillahFontCache.delete(url);
			throw error;
		});

		bismillahFontCache.set(url, promise);
	}

	return bismillahFontCache.get(url).then((loadedFont) => {
		// A newer font type was requested meanwhile, don't register this one
		if (latestBismillahUrl !== url) return;

		// Remove all other entries under the "bismillah" family, so a stale font is never used
		[...document.fonts].filter((f) => f.family === 'bismillah' && f !== loadedFont).forEach((f) => document.fonts.delete(f));

		document.fonts.add(loadedFont);
	});
}