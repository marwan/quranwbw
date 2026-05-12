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

	// Resolves the correct font file for the active font type, handles the
	// Firefox dark-mode Tajweed special case, then loads the font via loadFont().
	// All .bismillah elements are hidden until the font is ready to avoid FOUT.
	function getBismillahFontName() {
		const elements = document.querySelectorAll('.bismillah');
		elements.forEach((el) => el.classList.add('invisible'));

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

		// Remove ALL existing FontFace entries under the "bismillah" family —
		// this forces the browser to load the correct file for the current font type
		// rather than reusing a stale entry from a previous font type or page visit.
		[...document.fonts].filter((f) => f.family === 'bismillah').forEach((f) => document.fonts.delete(f));

		// Manage the FontFace directly so we have full control over when the font is registered and revealed.
		const fontFace = new FontFace('bismillah', `url(${url})`);

		document.fonts.add(fontFace);

		fontFace.load().then(() => {
			elements.forEach((el) => el.classList.remove('invisible'));
		});
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
		<div style="font-family: bismillah" class="bismillah {chapterBismillahClasses}">
			<span>{getBismillahCode(chapter)}</span>
		</div>
	{/if}

	<!-- Mushaf — skipped for Al-Fatiha (1) and At-Tawbah (9) -->
{:else if $__currentPage === 'mushaf'}
	{#if chapters && lines}
		{@const currentChapter = chapters[lines.indexOf(line)]}
		{#if ![1, 9].includes(currentChapter)}
			<div style="font-family: bismillah" class="bismillah {mushafBismillahClasses}">
				{getBismillahCode(currentChapter)}
			</div>
		{/if}
	{/if}
{/if}
