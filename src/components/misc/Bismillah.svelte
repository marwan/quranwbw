<script>
	export let chapter = $__chapterNumber;
	export let chapters = null;
	export let lines = null;
	export let line = null;
	export let startVerse = null;
	export let page = null;

	import { __currentPage, __chapterNumber, __fontType, __websiteTheme } from '$utils/stores';
	import { isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';
	import { staticEndpoint } from '$data/websiteSettings';
	import { bismillahFontMap } from '$data/bismillahFontMap';

	// True for font types that use the Uthmanic script (affects sizing and padding)
	$: isUthmaniFontType = [1, 2, 3, 5, 7, 8].includes($__fontType);

	// Holds any extra CSS palette class needed for the current font (e.g. Tajweed color palette)
	let customFontPalette = '';

	// The bismillah stays invisible until its font is ready. Driven by state (not by
	// querying the DOM), so it also works when the component mounts after the load starts.
	let fontReady = false;

	// Stale load guard — only the latest font load is allowed to register and reveal
	let currentFontLoadId = 0;

	// Downloads the font, and retries once if the first attempt fails
	function downloadFont(url) {
		const attempt = () => new FontFace('bismillah', `url(${url})`).load();
		return attempt().catch(attempt);
	}

	// Resolves the correct font file for the active font type, handles the
	// Firefox dark-mode Tajweed special case, then loads the font.
	// The bismillah is hidden until the font is ready, so the raw fallback glyphs are never shown.
	// If both attempts fail it stays invisible instead of showing raw glyphs.
	function getBismillahFontName() {
		const thisLoadId = ++currentFontLoadId;
		fontReady = false;

		// Fall back to the Tajweed COLOR font if the active type isn't in the map
		const defaultBismillah = bismillahFontMap[3].file;

		let { file: fileName, version: fontVersion } = {
			file: defaultBismillah,
			version: 13
		};

		// Override with the mapped values when available
		if (bismillahFontMap[$__fontType]) {
			({ file: fileName, version: fontVersion } = bismillahFontMap[$__fontType]);
		}

		// Special case: font type 3 (Tajweed COLOR) needs a different file in
		// Firefox dark mode, and also switches to a different CSS colour palette.
		if ($__fontType === 3) {
			fileName = isFirefoxDarkTajweed() ? bismillahFontMap.firefoxDarkTajweed.file : defaultBismillah;
			customFontPalette = isFirefoxDarkTajweed() ? 'hafs-palette-firefox-dark' : 'theme-palette-tajweed';
			fontVersion = 13;
		} else {
			// Reset palette when switching away from font type 3
			customFontPalette = '';
		}

		// Build the CDN URL with cache-busting version query param
		const url = `${staticEndpoint}/fonts/Extras/bismillah/${fileName}.woff2?version=${fontVersion}`;

		downloadFont(url)
			.then((loadedFont) => {
				// A newer font type was selected meanwhile, let that load handle the reveal
				if (thisLoadId !== currentFontLoadId) return;

				// Remove ALL existing FontFace entries under the "bismillah" family —
				// this makes sure the browser uses the file of the current font type
				// rather than a stale entry from a previous font type or page visit.
				[...document.fonts].filter((f) => f.family === 'bismillah').forEach((f) => document.fonts.delete(f));

				document.fonts.add(loadedFont);
				fontReady = true;
			})
			.catch(() => {});
	}

	// Re-run font loading whenever the font type changes
	$: if ($__fontType) getBismillahFontName();

	// Returns the correct Unicode glyph string for a given chapter number,
	// using the per-chapter override when defined, otherwise the default.
	function getBismillahCode(chapterNum) {
		const fontData = bismillahFontMap[$__fontType];
		if (!fontData) return '';

		const { bismillah } = fontData;

		// Use chapter-specific override if available, otherwise fall back to default
		if (bismillah.chapters && bismillah.chapters[chapterNum]) {
			return bismillah.chapters[chapterNum];
		}
		return bismillah.default;
	}

	// Classes shared across both chapter and mushaf bismillah containers
	$: commonClasses = `
		${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
		${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
		${customFontPalette}
	`;

	// Classes for the bismillah shown on chapter / juz / hizb pages
	$: chapterBismillahClasses = `
		text-theme-text
		flex flex-col text-center flex-wrap block pb-2
		${isUthmaniFontType && chapter === 2 ? 'pt-8' : 'pt-12'}
		${isUthmaniFontType ? `${chapter === 2 ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}` : 'arabic-font-4 text-3xl md:text-4xl'}
		${commonClasses}
	`;

	// Classes for the bismillah shown on mushaf (page-view) pages
	$: mushafBismillahClasses = `
		flex flex-col text-center leading-normal flex-wrap space-y-4 block
		${page === 1 || page === 2 ? 'md:mt-2' : 'md:mt-6'}
		${page === 2 ? 'text-[5vw] md:text-[36px] lg:text-[36px]' : 'text-[5vw] md:text-[32px] lg:text-[36px]'}
		${commonClasses}
	`;
</script>

<!-- Chapter / Juz / Hizb — skipped for Al-Fatiha (1) and At-Tawbah (9) unless starting mid-chapter -->
{#if ['chapter', 'juz', 'hizb'].includes($__currentPage)}
	{#if ![1, 9].includes(chapter) || (chapter === 1 && startVerse > 1)}
		<div style="font-family: bismillah" class="bismillah {fontReady ? '' : 'invisible'} {chapterBismillahClasses}">
			<span>{getBismillahCode(chapter)}</span>
		</div>
	{/if}

	<!-- Mushaf — skipped for Al-Fatiha (1) and At-Tawbah (9) -->
{:else if $__currentPage === 'mushaf'}
	{#if chapters && lines}
		{@const currentChapter = chapters[lines.indexOf(line)]}
		{#if ![1, 9].includes(currentChapter)}
			<div style="font-family: bismillah" class="bismillah {fontReady ? '' : 'invisible'} {mushafBismillahClasses}">
				{getBismillahCode(currentChapter)}
			</div>
		{/if}
	{/if}
{/if}