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

	// Same name from another URL — drop the previous face so it doesn't take precedence over the new one
	if (cached) {
		document.fonts.delete(cached.fontFace);
	}

	// First time loading this font (or this URL) — create and cache the promise
	const myFont = new FontFace(name, `url(${url})`);
	const promise = new Promise((resolve, reject) => {
		myFont
			.load()
			.then(() => {
				// Skip a face that was replaced while it was still loading
				if (fontCache.get(name)?.fontFace === myFont) document.fonts.add(myFont);
				const el = document.createElement('DIV');
				el.style.fontFamily = name;
				resolve();
			})
			.catch(() => {
				if (fontCache.get(name)?.fontFace === myFont) fontCache.delete(name); // remove on failure so it can be retried
				reject();
			});
	});

	fontCache.set(name, { url, fontFace: myFont, promise });
	return promise;
}
