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