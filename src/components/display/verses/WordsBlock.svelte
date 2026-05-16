<script>
	export let key;
	export let value;
	export let line = null;
	export let exampleVerse = false;

	import VerseOptionsDropdown from '$display/verses/VerseOptionsDropdown.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { goto } from '$app/navigation';
	import { selectableDisplays, selectableWordTranslations, selectableWordTransliterations } from '$data/options';
	import { supplicationsFromQuran } from '$data/quranMeta';
	import { __currentPage, __fontType, __displayType, __userSettings, __audioSettings, __morphologyKey, __verseKey, __websiteTheme, __morphologyModalVisible, __wordMorphologyOnClick, __wordTranslation, __wordTransliteration, __wordTranslationEnabled, __wordTransliterationEnabled, __wordTooltip, __hideNonDuaPart, __signLanguageModeEnabled } from '$utils/stores';
	import { loadFont } from '$utils/loadFont';
	import { wordAudioController } from '$utils/audioController';
	import { updateSettings } from '$utils/updateSettings';
	import { getMushafWordFontLink, isFirefoxDarkNonTajweed, isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';

	const mushafFontTypes = [2, 3];
	const fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	const chapter = key.split(':')[0];
	const verse = key.split(':')[1];
	const arabicWords = value.words.arabic;
	const transliterationWords = value.words.transliteration;
	const translationWords = value.words.translation;

	// fix for Ba'da and Ma Ja'aka for page 254
	// since it's just a cosmetic change, there's no need of changing it at database level
	const fixedMushafWords = {
		'13:37:8': 'ﱿ', // 6th line last word - Ba'da
		'13:37:9': 'ﲀﲁ' // 7th line first word - Ma Ja'aka
	};

	// Words start invisible and are revealed once the page font is loaded.
	// `pageVisible` is intentionally a plain `let` (not a store) so each verse
	// component manages its own page's visibility independently — setting it to
	// `true` triggers Svelte to re-render and drop the `invisible` class naturally,
	// without fighting Svelte's DOM patching via classList.remove().
	let pageVisible = false;

	// Load the Mushaf font and reveal words whenever the font type switches to 2 or 3.
	$: if (mushafFontTypes.includes($__fontType)) {
		loadFont(`p${value.meta.page}`, getMushafWordFontLink(value.meta.page)).then(() => {
			pageVisible = true;
		});
	}

	// Re-run on theme change when already using font type 2 or 3 — switching themes
	// resets words back to invisible (via v4hafsClasses) and we need to restore their visibility.
	$: if ($__websiteTheme && mushafFontTypes.includes($__fontType)) {
		pageVisible = true;
	}

	// True when the active display type renders verses as a continuous flow
	$: displayIsContinuous = selectableDisplays[$__displayType].continuous;

	// Handles click interactions on words and verse-end icons.
	//
	// Word click behavior:
	//   1. Morphology page → navigate to the word's morphology details page.
	//   2. Other pages (if word morphology on click is enabled, or modal is open)
	//      → open the morphology modal for the clicked word.
	//   3. All other cases → set the verse key and play the word's audio.
	//
	// Verse-end icon click behavior:
	//   - Adds a bookmark for that verse (only when not in continuous display mode,
	//     since continuous mode has no per-verse end icons to bookmark against).
	function wordClickHandler(props) {
		if ($__currentPage === 'morphology' && props.type === 'word') {
			__morphologyKey.set(props.key);
			goto(`/morphology?word=${props.key}`, { replaceState: false });
		} else if ((!['morphology', 'mushaf'].includes($__currentPage) && props.type === 'word' && $__wordMorphologyOnClick) || $__morphologyModalVisible) {
			__morphologyKey.set(props.key);
			__morphologyModalVisible.set(true);
		} else {
			__verseKey.set(props.key);

			if (props.type === 'word') {
				wordAudioController({ key: props.key });
			} else if (props.type === 'end') {
				if (!displayIsContinuous) {
					updateSettings({
						type: 'userBookmarks',
						key: props.key,
						set: true
					});
				}
			}
		}
	}

	// Common classes for words and end icons
	$: wordAndEndIconCommonClasses = `
		hover:cursor-pointer
		hover:bg-theme-accent/5
		${$__displayType === 1 ? 'text-center flex flex-col' : 'inline-flex flex-col'}
		${selectableDisplays[$__displayType].layout === 'wbw' ? 'p-3' : mushafFontTypes.includes($__fontType) ? ($__currentPage === 'mushaf' ? 'p-0' : 'px-0 py-1') : 'p-1'}
		${exampleVerse && '!p-0'}
	`;

	// Classes for word spans
	$: wordSpanClasses = `
		arabicText leading-normal 
		arabic-font-${$__fontType} 
		${$__currentPage !== 'mushaf' && fontSizes.arabicText} 
		${displayIsContinuous && 'inline-block'}
		${$__fontType === 9 && 'pb-4'}
		${$__fontType === 10 && 'custom-majidi-font-color'}
	`;

	// Classes for v4 Hafs words:
	//
	// Visibility:
	//   - Words start invisible and become visible once the page font is loaded,
	//     controlled via the `pageVisible` flag (set by loadFont's promise).
	//     This prevents a flash of unstyled/missing glyphs before the font is ready.
	//
	// Palette (color) logic:
	//   1. Firefox + dark theme overrides:
	//      - Font type 3 (Tajweed) → "hafs-palette-firefox-dark" (Firefox-specific fix)
	//      - Font type 2 (Non-Tajweed) → no palette class applied
	//
	//   2. All other browsers/themes:
	//      - Font type 3 → "theme-palette-tajweed"
	//      - All others → "theme-palette-normal"
	//      - Font type 2 + Mocha Night (theme 5) → also adds "mocha-night-font-color"
	//      - Font type 2 + Dark Luxury (theme 9) → also adds "dark-luxury-font-color"
	const pageClass = `p${value.meta.page}`;

	$: v4hafsClasses = `
		v4-words 
		${pageClass}
		${pageVisible ? '' : 'invisible'}
		${
			isFirefoxDarkTajweed()
				? 'hafs-palette-firefox-dark'
				: isFirefoxDarkNonTajweed()
					? ''
					: `
						${$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'}
						${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
						${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
					`
		}
	`;

	// Classes for end icons
	// In Golden Glint theme, the end icon should be gold (except for Majidi Nastaleeq Digital Font)
	$: endIconClasses = `
		rounded-lg 
		${wordAndEndIconCommonClasses}
		${$__websiteTheme === 1 && $__fontType !== 10 ? 'text-theme-accent' : ''}
	`;

	// Classes for word translation and transliteration
	$: wordTranslationClasses = `
		wordTranslationText flex flex-col direction-ltr
		${fontSizes.wordTranslationText}
		theme
	`;

	// Function to check if word should be displayed
	function shouldDisplayWord(wordIndex) {
		return $__currentPage !== 'mushaf' || ($__currentPage === 'mushaf' && +value.words.line[wordIndex] === line);
	}

	// Function to get word key
	function getWordKey(wordIndex) {
		return `${chapter}:${verse}:${wordIndex + 1}`;
	}
</script>

<!-- words -->
{#each { length: value.meta.words } as _, word}
	{#if shouldDisplayWord(word)}
		{@const wordKey = getWordKey(word)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			id={wordKey}
			class={`
				word rounded-lg ${wordAndEndIconCommonClasses} text-center print:break-inside-avoid
				${$__audioSettings.playingWordKey === wordKey || ($__currentPage === 'morphology' && $__morphologyKey === wordKey) || ($__morphologyModalVisible && $__morphologyKey === wordKey) ? 'bg-theme-accent/15' : ''}
				${$__currentPage === 'supplications' && word + 1 < (supplicationsFromQuran[key] || 0) ? ($__hideNonDuaPart ? 'hidden' : 'opacity-30') : ''}
			`.trim()}
			on:click={() => wordClickHandler({ key: wordKey, type: 'word' })}
		>
			<span class={wordSpanClasses} data-fontSize={fontSizes.arabicText}>
				<!-- Mushaf fonts -->
				{#if mushafFontTypes.includes($__fontType)}
					<span id="word-{wordKey.split(':')[1]}-{wordKey.split(':')[2]}" style="font-family: p{value.meta.page}" class={v4hafsClasses}>
						<!-- word fix, see fixedMushafWords -->
						{#if Object.prototype.hasOwnProperty.call(fixedMushafWords, wordKey)}
							{fixedMushafWords[wordKey]}
						{:else}
							{arabicWords[word]}
						{/if}
					</span>

					<!-- Everything except Mushaf fonts -->
				{:else}
					{arabicWords[word]}
				{/if}
			</span>

			<!-- word translation and transliteration, only for wbw modes -->
			{#if [1, 3, 7].includes($__displayType)}
				<div class={wordTranslationClasses} data-fontSize={fontSizes.wordTranslationText}>
					<span class="leading-normal {selectableWordTransliterations[$__wordTransliteration].font} {$__wordTransliterationEnabled ? 'block' : 'hidden'}">{transliterationWords[word]}</span>
					<span class="leading-normal {selectableWordTranslations[$__wordTranslation].font} {$__wordTranslationEnabled ? 'block' : 'hidden'}">
						<span class={$__signLanguageModeEnabled && 'font-Arabic-Sign-Language'}>{translationWords[word]}</span>
					</span>
				</div>
			{/if}
		</div>

		<!-- word tooltip -->
		{#if $__wordTooltip > 1}
			<Tooltip arrow={false} type="light" class="z-30 hidden md:block text-center inline-flex font-sans font-normal">
				{#if $__wordTooltip === 2}
					{@html transliterationWords[word]}
				{:else if $__wordTooltip === 3}
					{@html `<span class="${selectableWordTranslations[$__wordTranslation].customClasses}">${translationWords[word]}</span>`}
				{:else if $__wordTooltip === 4}
					{@html `
						<div class="flex flex-col">
							<span>${transliterationWords[word]}</span>
							<div class="border-t border-theme-bg my-1"></div> 
							<span class="${selectableWordTranslations[$__wordTranslation].customClasses}">${translationWords[word]}</span>
						</div>
					`}
				{/if}
			</Tooltip>
		{/if}
	{/if}
{/each}

<!-- end icon -->
{#if $__currentPage !== 'mushaf' || ($__currentPage === 'mushaf' && value.words.line[value.words.line.length - 1] === line)}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class={endIconClasses} on:click={() => wordClickHandler({ key, type: 'end' })}>
		<span class={wordSpanClasses} data-fontSize={fontSizes.arabicText}>
			<!-- Mushaf fonts -->
			{#if mushafFontTypes.includes($__fontType)}
				<span style="font-family: p{value.meta.page}" class="{v4hafsClasses} custom-ayah-icon-color">{value.words.end}</span>

				<!-- Everything except Mushaf fonts -->
			{:else}
				<span class={$__fontType !== 10 && 'colored-fonts'}>{value.words.end}</span>
			{/if}
		</span>
	</div>
	{#if displayIsContinuous && !$__morphologyModalVisible}
		<VerseOptionsDropdown page={value.meta.page} />
	{/if}

	<!-- end icon tooltip -->
	<Tooltip arrow={false} type="light" class="z-30 inline-flex font-sans font-normal">
		End of {key}
	</Tooltip>
{/if}
