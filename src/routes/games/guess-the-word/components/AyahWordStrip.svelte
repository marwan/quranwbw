<script context="module">
	// Word data is a whole-Quran file per font; keep one request per font for the session.
	const wordDataByFont = new Map();

	// Returns the whole-Quran word data for a font type. The first call starts the download and later calls
	// reuse it. If the download fails, it is forgotten so the next call can try again.
	function getWordData(type) {
		if (!wordDataByFont.has(type)) {
			wordDataByFont.set(
				type,
				fetchWordData(type, 1, 1).catch((error) => (wordDataByFont.delete(type), Promise.reject(error)))
			);
		}
		return wordDataByFont.get(type);
	}
</script>

<script>
	// One line of Quran text in the user's font: the previous ayah ۞ the current one ۞ the next one.
	// The current word stays centered and the line slides to each new word, and from the last word
	// of an ayah straight into the next. Mushaf (v4 page) fonts are handled like WordsBlock.
	export let ayah; // the ayah being played
	export let nextAyah = null; // the ayah after it, shown on the left of the line when known
	export let wordIndex = 0; // position of the word the player is asked about

	import { afterUpdate, onMount } from 'svelte';
	import { fetchWordData } from '$utils/fetchData';
	import { loadFont } from '$utils/loadFont';
	import { playWordAudio } from '$utils/audioController';
	import { getMushafWordFontLink, isFirefoxDarkNonTajweed, isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';
	import { __fontType, __websiteTheme } from '$utils/stores';
	import { reducedMotion } from '../utils/reducedMotion';

	// Font types that draw each page with its own font file (2 = plain Mushaf, 3 = Tajweed)
	const mushafFontTypes = [2, 3];
	// Timing of the slide between words
	const slide = { duration: 250, easing: 'ease-out' };

	let viewport; // the visible window of the strip (clips the line)
	let track; // the long line of words that slides inside the viewport

	// Remember the ayah that was shown before, so it can stay on the line for a moment after the player moves on
	let previousAyah = null;
	let shownAyah = ayah;
	// When the ayah changes, the one we were showing becomes the previous one
	$: if (ayah.key !== shownAyah.key) [previousAyah, shownAyah] = [shownAyah, ayah];

	$: currentWord = ayah.words[wordIndex];
	// The ayahs on the line: previous, current and next. Empty ones and duplicates are removed
	// (for example, when a range wraps around, the next ayah can be the same as the previous one).
	$: lineAyahs = [previousAyah, ayah, nextAyah].filter((entry, index, all) => entry && all.findIndex((other) => other?.key === entry.key) === index);

	// Ayahs ready to draw in the current font: words fetched and, for Mushaf fonts, the page font loaded,
	// so nothing is ever drawn in a stand-in font. Only the ayahs on the line are kept.
	let ready = new Map(); // ayah key -> the words and font details to draw it
	const pending = new Set(); // "fontType|ayahKey" of loads in progress, so the same one is not started twice
	// Start preparing every ayah on the line (again whenever the line or the font changes)
	$: lineAyahs.forEach((entry) => prepare(entry, $__fontType));
	// The flat list of words to draw. Nothing is drawn until the current ayah is ready, so the line never shows half.
	$: tokens = ready.has(ayah.key) ? lineAyahs.filter((entry) => ready.has(entry.key)).flatMap((entry, position) => wordTokens(entry, ready.get(entry.key), position)) : [];

	// Text colour classes for Mushaf fonts. The special Firefox dark cases come first, otherwise it depends
	// on Tajweed vs normal, plus extra colours for the Mocha Night and Dark Luxury themes (website theme 5 and 9).
	$: mushafPaletteClasses = isFirefoxDarkTajweed() ? 'hafs-palette-firefox-dark' : isFirefoxDarkNonTajweed() ? '' : [$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal', $__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : '', $__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''].join(' ');

	// Gets one ayah ready to be drawn in the given font: fetches its Arabic words and, for Mushaf fonts,
	// loads the font of its page. If anything fails, it falls back to the quiz's own words in the Digital
	// font, so the game keeps working. The result is saved in `ready`.
	async function prepare(entry, type) {
		const id = type + '|' + entry.key;
		// Skip if this ayah is already ready in this font, or is already being loaded
		if (ready.get(entry.key)?.type === type || pending.has(id)) return;
		pending.add(id);
		let segment;
		try {
			const { arabicWordData, metaVerseData } = await getWordData(type);
			const words = arabicWordData[entry.chapter]?.[entry.verse]?.[0];
			// The font's word list must have the same number of words as the quiz, or the words would not line up
			if (words?.length !== entry.words.length) throw new Error('Word data does not match the quiz.');
			const page = metaVerseData[entry.key]?.page;
			const mushaf = mushafFontTypes.includes(type);
			// Mushaf fonts have one font file per page, which must be loaded before the words are drawn
			if (mushaf) await loadFont(`p${page}`, getMushafWordFontLink(page));
			segment = { type, words, page, mushaf, fontClass: `arabic-font-${type}` };
		} catch {
			// Data or font unavailable: fall back to the quiz's own Digital-font words so the game keeps going.
			segment = { type, words: entry.words.map((word) => word.word_arabic), page: null, mushaf: false, fontClass: 'arabic-font-1' };
		} finally {
			pending.delete(id);
		}
		// The load took time, so check it is still needed: the font may have changed or the ayah left the line
		const onLine = (key) => lineAyahs.some((other) => other.key === key);
		if (type !== $__fontType || !onLine(entry.key)) return;
		// Save it, and drop anything that is in another font or no longer on the line
		ready = new Map([...ready, [entry.key, segment]].filter(([key, other]) => other.type === type && onLine(key)));
	}

	// Turns one ayah into the list of items to draw: one per word, keyed like "2:255:3".
	// Every ayah after the first gets a ۞ separator in front of it.
	function wordTokens(entry, segment, position) {
		const words = segment.words.map((text, index) => ({ key: `${entry.key}:${index + 1}`, text, segment }));
		return position === 0 ? words : [{ key: 'separator:' + entry.key }, ...words];
	}

	// Sliding. Tokens are keyed, so the centered word keeps its element when an ayah joins or leaves the line.
	// Words added or removed before it move it within the line; that shift is cancelled on screen first, measured
	// from where the line is right now (mid-slide included, otherwise the slide would be cut and the line would
	// snap), and then the line slides on to the new word.
	let anchor = null; // the word centered last and its position in the line
	let offset = null; // where the line is heading (translateX, px)
	let frame; // id of the pending animation frame, so it can be cancelled

	// Slides the line so the current word sits in the middle of the viewport
	function center() {
		const element = currentWord && track?.querySelector(`[data-word="${currentWord.word_key}"]`);
		if (!element) return;
		// How far the word we centered last has moved since then (happens when words are added or removed before it)
		const previous = anchor && track.querySelector(`[data-word="${anchor.key}"]`);
		const shift = previous ? previous.offsetLeft - anchor.left : 0;
		// The line position that puts the current word exactly in the middle
		const target = viewport.clientWidth / 2 - element.offsetLeft - element.offsetWidth / 2;
		anchor = { key: currentWord.word_key, left: element.offsetLeft };
		// Nothing moved and we are already heading to the right place: nothing to do
		if (!shift && target === offset) return;
		// Where the slide starts: where the line is on screen right now (read from its current transform),
		// minus the shift above, so the line does not jump when words are added. Very first time: no slide.
		const from = previous ? new DOMMatrixReadOnly(getComputedStyle(track).transform).m41 - shift : target;
		offset = target;
		// Stop any slide still running, jump to the final position, then animate from where it visually was
		track.getAnimations().forEach((animation) => animation.cancel());
		track.style.transform = `translateX(${target}px)`;
		// Skip the animation for tiny moves or when the user prefers reduced motion
		if (Math.abs(from - target) > 0.5 && !$reducedMotion) track.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${target}px)` }], slide);
	}

	// Measure in the next frame, alongside the layout the browser does anyway, instead of forcing one mid-update.
	function scheduleCenter() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(center);
	}

	// Re-center after every update of the component (new word, new ayah, words finished loading)
	afterUpdate(scheduleCenter);

	onMount(() => {
		// Keep the current word centered when the strip is resized or a web font finishes loading.
		const observer = new ResizeObserver(scheduleCenter);
		observer.observe(viewport);
		document.fonts?.addEventListener('loadingdone', scheduleCenter);
		// Cleanup when the component is removed
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			document.fonts?.removeEventListener('loadingdone', scheduleCenter);
		};
	});
</script>

<div class="flex flex-col items-center">
	<!-- Clipped on the x axis only, so tall or low marks are never cut; the edges fade into the page background.
	Marks reach up to ~0.6em past the line box in some fonts: the margin above and pb below keep them off their neighbours. -->
	<div bind:this={viewport} class="relative w-full overflow-x-clip pb-[0.6em] text-4xl sm:text-5xl md:text-6xl" dir="ltr">
		<div bind:this={track} class="relative flex min-h-[1.5em] w-max items-center gap-x-4 leading-normal md:gap-x-6" dir="rtl" lang="ar">
			<!-- The other words are faded by this veil in the page background color, not by opacity on the text:
			see-through text is painted once per glyph piece, so where joined Arabic letters overlap it doubles up
			into darker dots. The veil reaches 0.6em past the line so tall and low marks are faded too. -->
			<div class="pointer-events-none absolute inset-x-0 -inset-y-[0.6em] bg-theme-bg/80"></div>
			{#each tokens as token (token.key)}
				{#if !token.segment}
					<span class="arabic-font-1 shrink-0 text-theme-accent" aria-hidden="true">۞</span>
				{:else}
					{@const isCurrent = token.key === currentWord.word_key}
					<button
						data-word={token.key}
						type="button"
						class="{token.segment.fontClass} shrink-0 rounded-lg px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent {isCurrent ? 'relative z-10' : 'pointer-events-none'}"
						tabindex={isCurrent ? 0 : -1}
						aria-hidden={isCurrent ? undefined : 'true'}
						aria-label={isCurrent ? 'Listen to ' + (currentWord.word_transliteration || currentWord.word_arabic) : undefined}
						on:click={() => playWordAudio({ key: currentWord.word_key })}
					>
						{#if token.segment.mushaf}
							<span class="v4-words {mushafPaletteClasses}" style="font-family: p{token.segment.page}">{token.text}</span>
						{:else}
							{token.text}
						{/if}
					</button>
				{/if}
			{/each}
		</div>
		<div class="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-theme-bg"></div>
		<div class="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-theme-bg"></div>
	</div>
	<p class="mt-1 text-sm md:text-base">{currentWord.word_transliteration}</p>
</div>
