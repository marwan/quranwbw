<script context="module">
	// Word data is a whole-Quran file per font; keep one request per font for the session.
	const wordDataByFont = new Map();

	function getWordData(type) {
		if (!wordDataByFont.has(type)) {
			wordDataByFont.set(type, fetchWordData(type, 1, 1).catch((error) => (wordDataByFont.delete(type), Promise.reject(error))));
		}
		return wordDataByFont.get(type);
	}
</script>

<script>
	// One line of Quran text in the user's font: the previous ayah ۞ the current one ۞ the next one.
	// The current word stays centered and the line slides to each new word, and from the last word
	// of an ayah straight into the next. Mushaf (v4 page) fonts are handled like WordsBlock.
	export let ayah;
	export let nextAyah = null;
	export let wordIndex = 0;

	import { afterUpdate, onMount } from 'svelte';
	import { fetchWordData } from '$utils/fetchData';
	import { loadFont } from '$utils/loadFont';
	import { playWordAudio } from '$utils/audioController';
	import { getMushafWordFontLink, isFirefoxDarkNonTajweed, isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';
	import { __fontType, __websiteTheme } from '$utils/stores';

	const mushafFontTypes = [2, 3];
	const slide = { duration: 250, easing: 'ease-out' };

	let viewport;
	let track;
	let reducedMotion = false;

	let previousAyah = null;
	let shownAyah = ayah;
	$: if (ayah.key !== shownAyah.key) [previousAyah, shownAyah] = [shownAyah, ayah];

	$: currentWord = ayah.words[wordIndex];
	$: lineAyahs = [previousAyah, ayah, nextAyah].filter((entry, index, all) => entry && all.findIndex((other) => other?.key === entry.key) === index);

	// Ayahs ready to draw in the current font: words fetched and, for Mushaf fonts, the page font loaded,
	// so nothing is ever drawn in a stand-in font. Only the ayahs on the line are kept.
	let ready = new Map();
	const pending = new Set();
	$: lineAyahs.forEach((entry) => prepare(entry, $__fontType));
	$: tokens = ready.has(ayah.key) ? lineAyahs.filter((entry) => ready.has(entry.key)).flatMap((entry, position) => wordTokens(entry, ready.get(entry.key), position)) : [];

	$: mushafPaletteClasses = isFirefoxDarkTajweed()
		? 'hafs-palette-firefox-dark'
		: isFirefoxDarkNonTajweed()
			? ''
			: [$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal', $__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : '', $__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''].join(' ');

	async function prepare(entry, type) {
		const id = type + '|' + entry.key;
		if (ready.get(entry.key)?.type === type || pending.has(id)) return;
		pending.add(id);
		let segment;
		try {
			const { arabicWordData, metaVerseData } = await getWordData(type);
			const words = arabicWordData[entry.chapter]?.[entry.verse]?.[0];
			if (words?.length !== entry.words.length) throw new Error('Word data does not match the quiz.');
			const page = metaVerseData[entry.key]?.page;
			const mushaf = mushafFontTypes.includes(type);
			if (mushaf) await loadFont(`p${page}`, getMushafWordFontLink(page));
			segment = { type, words, page, mushaf, fontClass: `arabic-font-${type}` };
		} catch {
			// Data or font unavailable: fall back to the quiz's own Digital-font words so the game keeps going.
			segment = { type, words: entry.words.map((word) => word.word_arabic), page: null, mushaf: false, fontClass: 'arabic-font-1' };
		} finally {
			pending.delete(id);
		}
		const onLine = (key) => lineAyahs.some((other) => other.key === key);
		if (type !== $__fontType || !onLine(entry.key)) return;
		ready = new Map([...ready, [entry.key, segment]].filter(([key, other]) => other.type === type && onLine(key)));
	}

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
	let frame;

	function center() {
		const element = currentWord && track?.querySelector(`[data-word="${currentWord.word_key}"]`);
		if (!element) return;
		const previous = anchor && track.querySelector(`[data-word="${anchor.key}"]`);
		const shift = previous ? previous.offsetLeft - anchor.left : 0;
		const target = viewport.clientWidth / 2 - element.offsetLeft - element.offsetWidth / 2;
		anchor = { key: currentWord.word_key, left: element.offsetLeft };
		if (!shift && target === offset) return;
		const from = previous ? new DOMMatrixReadOnly(getComputedStyle(track).transform).m41 - shift : target;
		offset = target;
		track.getAnimations().forEach((animation) => animation.cancel());
		track.style.transform = `translateX(${target}px)`;
		if (Math.abs(from - target) > 0.5 && !reducedMotion) track.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${target}px)` }], slide);
	}

	// Measure in the next frame, alongside the layout the browser does anyway, instead of forcing one mid-update.
	function scheduleCenter() {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(center);
	}

	afterUpdate(scheduleCenter);

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// Keep the current word centered when the strip is resized or a web font finishes loading.
		const observer = new ResizeObserver(scheduleCenter);
		observer.observe(viewport);
		document.fonts?.addEventListener('loadingdone', scheduleCenter);
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
