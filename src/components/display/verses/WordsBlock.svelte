<script>
	export let key;
	export let value;
	export let line = null;
	export let exampleVerse = false;

	import VerseOptionsDropdown from '$display/verses/VerseOptionsDropdown.svelte';
	import Word from '$display/verses/Word.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { goto } from '$app/navigation';
	import { selectableDisplays } from '$data/options';
	import { __currentPage, __fontType, __displayType, __userSettings, __audioSettings, __morphologyKey, __verseKey, __websiteTheme, __morphologyModalVisible, __wordMorphologyOnClick } from '$utils/stores';
	import { loadFont } from '$utils/loadFont';
	import { wordAudioController } from '$utils/audioController';
	import { updateSettings } from '$utils/updateSettings';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';

	const fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
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
				wordAudioController({
					key: props.key,
					chapter: +props.key.split(':')[0],
					verse: +props.key.split(':')[1]
				});
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
	`;

	// Classes for v4 hafs words
	// If tajweed fonts were select, apply tajweed palette
	// But in Mocha Night & Dark Luxury themes, if non-tajweed fonts were selected, use custom palette to match theme
	$: v4hafsClasses = `
		invisible v4-words 
		p${value.meta.page} 
		${$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'} 
		${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
		${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
	`;

	// Classes for end icons
	// In Golden Glint theme, the end icon should be gold
	$: endIconClasses = `
		rounded-lg 
		${wordAndEndIconCommonClasses}
		${$__websiteTheme === 1 && `${window.theme('textSecondary')}`}
	`;
</script>

<!-- words -->
{#each { length: value.meta.words } as _, word}
	<Word {value} {word} {key} {line} {wordClickHandler} {wordAndEndIconCommonClasses} {wordSpanClasses} {v4hafsClasses} />
{/each}

<!-- end icon -->
{#if $__currentPage != 'mushaf' || ($__currentPage === 'mushaf' && value.words.end_line === line)}
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
	<Tooltip arrow={false} type="light" class="z-30 inline-flex font-sans font-normal">
		End of {key}
	</Tooltip>
{/if}
