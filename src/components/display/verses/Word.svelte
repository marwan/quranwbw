<script>
	export let word;
	export let key;
	export let value;
	export let line = null;
	export let wordClickHandler;
	export let wordAndEndIconCommonClasses;
	export let wordSpanClasses;
	export let v4hafsClasses;

	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	// import Popover from '$ui/FlowbiteSvelte/popover/Popover.svelte';
	// import Spinner from '$svgs/Spinner.svelte';

	import { selectableThemes, selectableWordTranslations } from '$data/options';
	import { supplicationsFromQuran } from '$data/quranMeta';
	import { __currentPage, __fontType, __displayType, __userSettings, __audioSettings, __wordTranslation, __wordTranslationEnabled, __wordTransliterationEnabled, __morphologyKey, __wordTooltip, __verseKey, __websiteTheme, __hideNonDuaPart, __morphologyModalVisible } from '$utils/stores';
	// import { tajweedRulings, tajweedColorIds } from '$data/tajweedRulings';
	import { apiEndpoint, splitDelimiter } from '$data/websiteSettings';

	const chapter = key.split(':')[0];
	const verse = key.split(':')[1];
	const wordKey = `${chapter}:${verse}:${word + 1}`;
	const fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	const arabicSplit = value.words.arabic.split(splitDelimiter);
	const transliterationSplit = value.words.transliteration.split(splitDelimiter);
	const translationSplit = value.words.translation.split(splitDelimiter);
	const v4PopoverEnabled = false;

	// fix for Ba'da Ma Ja'aka for page 254
	// since it's just a cosmetic change, there's no need of changing it at database level
	const fixedMushafWords = {
		'13:37:8': 'ﱿ', // 6th line last word - Ba'da
		'13:37:9': 'ﲀﲁ' // 7th line first word - Ma Ja'aka
	};

	$: wordDivClasses = `
	  word rounded-lg ${wordAndEndIconCommonClasses} text-center print:break-inside-avoid
	  ${$__audioSettings.playingWordKey === wordKey || ($__currentPage === 'morphology' && $__morphologyKey === wordKey) || ($__morphologyModalVisible && $__morphologyKey === wordKey) ? (selectableThemes[$__websiteTheme].palette === 1 ? `${window.theme('bgSecondaryDark')}` : `${window.theme('bgSecondaryDark')}`) : null}
		${$__currentPage === 'supplications' && word + 1 < supplicationsFromQuran[key] ? ($__hideNonDuaPart ? 'hidden' : 'opacity-30') : null}
	`;

	$: wordTranslationClasses = `
		wordTranslationText flex flex-col direction-ltr
		${fontSizes.wordTranslationText}
		theme
	`;

	// let hoveredWordKey = null;
	// let wordTajweedData;

	// $: {
	// 	if (hoveredWordKey !== null && v4PopoverEnabled) {
	// 		const chapter = +hoveredWordKey.split(':')[0];
	// 		const verse = +hoveredWordKey.split(':')[1];
	// 		const word = +hoveredWordKey.split(':')[2];

	// 		wordTajweedData = (async () => {
	// 			const response = await fetch(`${apiEndpoint}/tajweed-data?key=${chapter}:${verse}`);
	// 			const data = await response.json();
	// 			const colorIds = data.data[word - 1].color_ids;
	// 			return colorIds;
	// 		})();
	// 	}
	// }
</script>

{#if $__currentPage !== 'mushaf' || ($__currentPage === 'mushaf' && +value.words.line.split(splitDelimiter)[word] === line)}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div id={wordKey} class={wordDivClasses} on:click={() => wordClickHandler({ key: wordKey, type: 'word' })}>
		<span class={wordSpanClasses} data-fontSize={fontSizes.arabicText}>
			<!-- Everything except Mushaf fonts -->
			{#if ![2, 3].includes($__fontType)}
				{arabicSplit[word]}
				<!-- Mushaf fonts -->
			{:else}
				<span id="word-{wordKey.split(':')[1]}-{wordKey.split(':')[2]}" style="font-family: p{value.meta.page}" class={v4hafsClasses}>
					<!-- word fix, see fixedMushafWords -->
					{#if fixedMushafWords.hasOwnProperty(wordKey)}
						{fixedMushafWords[wordKey]}
					{:else}
						{arabicSplit[word]}
					{/if}
				</span>
			{/if}
		</span>

		<!-- word translation and transliteration, only for wbw modes -->
		{#if [1, 3, 7].includes($__displayType)}
			<div class={wordTranslationClasses} data-fontSize={fontSizes.wordTranslationText}>
				<span class="leading-normal {$__wordTransliterationEnabled ? 'block' : 'hidden'}">{transliterationSplit[word]}</span>
				<span class="leading-normal {selectableWordTranslations[$__wordTranslation].font} {$__wordTranslationEnabled ? 'block' : 'hidden'}">{translationSplit[word]}</span>
			</div>
		{/if}
	</div>

	<!-- tajweed colors popover (only for QPC v4 font) -->
	<!-- {#if $__fontType === 3 && $__currentPage === 'chapter' && v4PopoverEnabled}
		<Popover class="w-64 text-sm font-light z-50 rounded-t-3xl" trigger="hover" triggeredBy="#word-{wordKey.split(':')[1]}-{wordKey.split(':')[2]}" arrow={false}>
			{#await wordTajweedData}
				<Spinner />
			{:then wordTajweedData}
				{#if wordTajweedData}
					<div class="flex flex-col space-y-1">
						{#each wordTajweedData.split(',') as id}
							<div class="flex flex-row space-x-2 items-center text-xs">
								<span class="tajweed-rules text-lg">{tajweedRulings[tajweedColorIds[id]].code}</span>
								<span>{tajweedRulings[tajweedColorIds[id]].title}</span>
							</div>
						{/each}
					</div>
				{:else}
					No data available.
				{/if}
			{:catch error}
				<p>error...</p>
			{/await}
		</Popover>
	{/if} -->

	<!-- word tooltip -->
	{#if $__wordTooltip > 1}
		<Tooltip arrow={false} type="light" class="z-30 hidden md:block text-center inline-flex font-sans font-normal">
			{#if $__wordTooltip === 2}
				{@html transliterationSplit[word]}
			{:else if $__wordTooltip === 3}
				{@html translationSplit[word]}
			{:else if $__wordTooltip === 4}
				{@html `<div class="flex flex-col">${transliterationSplit[word]} <div class="border-t"></div> ${translationSplit[word]}</div>`}
			{/if}
		</Tooltip>
	{/if}
{/if}
