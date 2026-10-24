// Loads a font by name and URL, adding it to the browser's FontFace API.
// Uses a module-level cache to deduplicate requests — if the same font is
// requested by multiple word instances simultaneously (which happens on every
// verse render), they all receive the same in-flight promise rather than
// triggering duplicate network requests. On failure, the cache entry is removed
// so the load can be retried.
// When a name is requested again with a different URL (e.g. a Mushaf page font switching
// between its COLRv1 and OT-SVG variants), the previous face is replaced so the new file is used.
// The family name itself stays the same because the @font-palette-values rules in app.css target it.
const fontCache = new Map();

export function loadFont(name, url) {
	const cached = fontCache.get(name);

	// Font is already loaded or currently loading — return the cached promise
	if (cached?.url === url) {
		return cached.promise;
	}

	// First time loading this font (or this URL) — create and cache the promise.
	// A previous face of the same name stays in use until the new one has loaded, so a failed replacement keeps it.
	const myFont = new FontFace(name, `url(${url})`);
	const promise = new Promise((resolve, reject) => {
		myFont
			.load()
			.then(() => {
				// Skip a face that was replaced while it was still loading
				if (fontCache.get(name)?.fontFace === myFont) {
					if (cached) document.fonts.delete(cached.fontFace);
					document.fonts.add(myFont);
				}
				const el = document.createElement('DIV');
				el.style.fontFamily = name;
				resolve();
			})
			.catch(() => {
				// remove on failure so it can be retried, or fall back to the face it was replacing
				if (fontCache.get(name)?.fontFace === myFont) {
					if (cached) fontCache.set(name, cached);
					else fontCache.delete(name);
				}
				reject();
			});
	});

	fontCache.set(name, { url, fontFace: myFont, promise });
	return promise;
}
