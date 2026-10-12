// Loads a font by name and URL, adding it to the browser's FontFace API.
// Uses a module-level cache to deduplicate requests — if the same font is
// requested by multiple word instances simultaneously (which happens on every
// verse render), they all receive the same in-flight promise rather than
// triggering duplicate network requests. On failure, the cache entry is removed
// so the load can be retried.
// The cache stores the URL per font name, so a different URL for the same name
// (e.g. colored vs non-colored font) is loaded and replaces the previous one.
const fontCache = new Map(); // name -> { url, promise }
const loadedFaces = new Map(); // name -> FontFace currently added to document.fonts

export function loadFont(name, url) {
	const cached = fontCache.get(name);

	// Same font and same URL is already loaded or currently loading — return the cached promise
	if (cached && cached.url === url) {
		return cached.promise;
	}

	// First time loading this font, or the URL changed — create and cache the promise
	const entry = { url, promise: null };

	entry.promise = new Promise((resolve, reject) => {
		const myFont = new FontFace(name, `url(${url})`);
		myFont
			.load()
			.then(() => {
				// A newer request for this name replaced this one while it was loading, so skip adding it
				if (fontCache.get(name) !== entry) {
					resolve();
					return;
				}

				// Remove the previous font face with the same name before adding the new one
				const previousFace = loadedFaces.get(name);
				if (previousFace) document.fonts.delete(previousFace);

				document.fonts.add(myFont);
				loadedFaces.set(name, myFont);
				resolve();
			})
			.catch(() => {
				// remove on failure so it can be retried
				if (fontCache.get(name) === entry) fontCache.delete(name);
				reject();
			});
	});

	fontCache.set(name, entry);
	return entry.promise;
}
