<script>
	export let key;
	export let value;
	export let line = null;
	export let exampleVerse = false;

	import VerseOptionsDropdown from '$display/verses/VerseOptionsDropdown.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { goto } from '$app/navigation';
	import { selectableDisplays, selectableWordTranslations } from '$data/options';
	import { supplicationsFromQuran } from '$data/quranMeta';
	import { __currentPage, __fontType, __displayType, __userSettings, __audioSettings, __morphologyKey, __verseKey, __websiteTheme, __morphologyModalVisible, __wordMorphologyOnClick, __wordTranslation, __wordTranslationEnabled, __wordTransliterationEnabled, __wordTooltip, __hideNonDuaPart, __signLanguageModeEnabled } from '$utils/stores';
	import { loadFont } from '$utils/loadFont';
	import { playVerseFromWord, wordAudioController } from '$utils/audioController';
	import { updateSettings } from '$utils/updateSettings';
	import { getMushafWordFontLink, isFirefoxDarkNonTajweed, isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';

	const fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	const chapter = key.split(':')[0];
	const verse = key.split(':')[1];
	const arabicWords = value.words.arabic;
	const transliterationWords = value.words.transliteration;
	const translationWords = value.words.translation;

	// fix for Ba'da Ma Ja'aka for page 254
	// since it's just a cosmetic change, there's no need of changing it at database level
	const fixedMushafWords = {
		'13:37:8': 'ﱿ', // 6th line last word - Ba'da
		'13:37:9': 'ﲀﲁ' // 7th line first word - Ma Ja'aka
	};

	$: displayIsContinuous = selectableDisplays[$__displayType].continuous;

	// Dynamically load the fonts if mushaf fonts are selected
	//v4 words are hidden by default and shown only when the font is loaded...
	if ([2, 3].includes($__fontType)) {
		loadFont(`p${value.meta.page}`, getMushafWordFontLink(value.meta.page)).then(() => {
			document.querySelectorAll(`.p${value.meta.page}`).forEach((element) => {
				element.classList.remove('invisible');
			});
		});
	}

	/**
	 * Handles click interactions on words or verse-end icons depending on the current page and context.
	 *
	 * Behavior:
	 * 1. **Morphology Page + Word Click**:
	 *    - Sets the selected morphology key and navigates to the word's morphology details.
	 *
	 * 2. **Other Pages + Word Click (if word-level morphology is enabled or modal is visible)**:
	 *    - Opens the morphology modal for the clicked word and sets the selected morphology key.
	 *
	 * 3. **General Case**:
	 *    - Sets the verse key for tracking purposes.
	 *    - If a word is clicked:
	 *      - Triggers audio playback for that specific word.
	 *    - If an end-verse icon is clicked:
	 *      - Adds a bookmark (if continuous display is disabled).
	 */
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
				if ($__audioSettings.playFromWordOnClick) {
					playVerseFromWord(props.key);
				} else {
					wordAudioController({
						key: props.key,
						chapter: +props.key.split(':')[0],
						verse: +props.key.split(':')[1]
					});
				}
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
		${window.theme('hover')}
		${$__displayType === 1 ? 'text-center flex flex-col' : 'inline-flex flex-col'}
		${selectableDisplays[$__displayType].layout === 'wbw' ? 'p-3' : [2, 3].includes($__fontType) ? ($__currentPage === 'mushaf' ? 'p-0' : 'px-0 py-1') : 'p-1'}
		${exampleVerse && '!p-0'}
	`;

	// Classes for word spans
	$: wordSpanClasses = `
		arabicText leading-normal 
		arabic-font-${$__fontType} 
		${$__currentPage !== 'mushaf' && fontSizes.arabicText} 
		${displayIsContinuous && 'inline-block'}
		${$__fontType === 9 && 'pb-4'}
	`;

	// Classes for v4 Hafs words:
	// 1. Special Firefox + Dark theme cases:
	//    - If font type is 3 (Tajweed) → apply "hafs-palette-firefox-dark"
	//      (fixes Firefox-specific rendering issues).
	//    - If font type is 2 (Non-Tajweed) → no palette applied (leave empty).
	//
	// 2. Otherwise (all non-Firefox or other cases):
	//    - If font type is 3 → apply "theme-palette-tajweed" (tajweed font coloring).
	//    - Else → apply "theme-palette-normal" (default palette).
	//    - If font type is 2 and theme is 5 (Mocha Night) → add "mocha-night-font-color".
	//    - If font type is 2 and theme is 9 (Dark Luxury) → add "dark-luxury-font-color".
	//
	// Summary:
	// - Firefox + dark theme overrides the palette logic (tajweed → special class, non-tajweed → none).
	// - All other browsers/themes follow the normal font-type and theme-based palettes.
	$: v4hafsClasses = `
		invisible v4-words 
		p${value.meta.page} 
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
	// In Golden Glint theme, the end icon should be gold
	$: endIconClasses = `
		rounded-lg 
		${wordAndEndIconCommonClasses}
		${$__websiteTheme === 1 && `${window.theme('textSecondary')}`}
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
				${$__audioSettings.playingWordKey === wordKey || ($__currentPage === 'morphology' && $__morphologyKey === wordKey) || ($__morphologyModalVisible && $__morphologyKey === wordKey) ? window.theme('bgSecondaryDark') : ''}
				${$__currentPage === 'supplications' && word + 1 < (supplicationsFromQuran[key] || 0) ? ($__hideNonDuaPart ? 'hidden' : 'opacity-30') : ''}
			`.trim()}
			on:click={() => wordClickHandler({ key: wordKey, type: 'word' })}
		>
			<span class={wordSpanClasses} data-fontSize={fontSizes.arabicText}>
				<!-- Everything except Mushaf fonts -->
				{#if ![2, 3].includes($__fontType)}
					{arabicWords[word]}
					<!-- Mushaf fonts -->
				{:else}
					<span id="word-{wordKey.split(':')[1]}-{wordKey.split(':')[2]}" style="font-family: p{value.meta.page}" class={v4hafsClasses}>
						<!-- word fix, see fixedMushafWords -->
						{#if Object.prototype.hasOwnProperty.call(fixedMushafWords, wordKey)}
							{fixedMushafWords[wordKey]}
						{:else}
							{arabicWords[word]}
						{/if}
					</span>
				{/if}
			</span>

			<!-- word translation and transliteration, only for wbw modes -->
			{#if [1, 3, 7].includes($__displayType)}
				<div class={wordTranslationClasses} data-fontSize={fontSizes.wordTranslationText}>
					<span class="leading-normal {$__wordTransliterationEnabled ? 'block' : 'hidden'}">{transliterationWords[word]}</span>
					<span class="leading-normal {selectableWordTranslations[$__wordTranslation].font} {$__wordTranslationEnabled ? 'block' : 'hidden'}">
						<span class={$__signLanguageModeEnabled && 'font-Arabic-Sign-Language'}>{translationWords[word]}</span>
					</span>
				</div>
			{/if}
		</div>

		<!-- word tooltip -->
		{#if $__wordTooltip > 1}
			<Tooltip arrow={false} type="light" class="z-[19] hidden md:block text-center inline-flex font-sans font-normal">
				{#if $__wordTooltip === 2}
					{@html transliterationWords[word]}
				{:else if $__wordTooltip === 3}
					{@html `<span class="${selectableWordTranslations[$__wordTranslation].customClasses}">${translationWords[word]}</span>`}
				{:else if $__wordTooltip === 4}
					{@html `
						<div class="flex flex-col">
							${transliterationWords[word]} 
							<div class="border-t"></div> 
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
			<!-- Everything except Mushaf fonts -->
			{#if ![2, 3].includes($__fontType)}
				<span class="colored-fonts">{value.words.end}</span>
				<!-- Mushaf fonts -->
			{:else}
				<span style="font-family: p{value.meta.page}" class="{v4hafsClasses} custom-ayah-icon-color">{value.words.end}</span>
			{/if}
		</span>
	</div>
	{#if displayIsContinuous && !$__morphologyModalVisible}
		<VerseOptionsDropdown page={value.meta.page} />
	{/if}

	<!-- end icon tooltip -->
	<Tooltip arrow={false} type="light" class="z-[19] inline-flex font-sans font-normal">
		End of {key}
	</Tooltip>
{/if}
