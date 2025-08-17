<script>
	// Import necessary components and utilities
	import PageHead from '$misc/PageHead.svelte';
	import Bismillah from '$misc/Bismillah.svelte';
	import Chapter from '$display/verses/modes/Chapter.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { parseURL } from '$utils/parseURL';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableDisplays } from '$data/options';
	import { __userSettings, __currentPage, __chapterNumber, __displayType, __fontType, __wordTranslation, __wordTransliteration, __verseTranslations, __firstVerseOnPage } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { goto } from '$app/navigation';
	import { term } from '$utils/terminologies';
	import { page } from '$app/stores';

	// Export data and verse range variables
	export let data, startVerse, endVerse;

	let chapterData;

	// Fetch verses whenever there's a change in chapter or URL parameters
	$: {
		// Update current chapter number
		__chapterNumber.set(+data.chapter);

		// Parse URL to get the range of verses to load
		[startVerse, endVerse] = parseURL();

		// Fetch chapter data
		chapterData = fetchChapterData({ chapter: $__chapterNumber });

		// Update the first verse on page
		__firstVerseOnPage.set(startVerse);

		// Check for store updates (page URL, display type, font type, word translation, transliteration)
		if ($page.url.href || $__displayType || $__fontType || $__wordTranslation || $__wordTransliteration) {
			// Do nothing except re-run the block
		}
	}

	$: fetchVerseTranslationData({ reRenderWhenTheseUpdates: $__verseTranslations });

	// Update the layout for the previous/next verse buttons
	$: loadPrevNextVerseButtons = `flex ${selectableDisplays[JSON.parse($__userSettings).displaySettings.displayType].continuous ? 'flex-row-reverse' : 'flex-row'} space-x-4 justify-center pt-8 pb-6`;

	// Function to load the previous verse
	function loadPreviousVerse() {
		const versesOnPage = document.getElementsByClassName('verse');
		const firstVerseOnPage = +versesOnPage[0].id.split(':')[1];
		goto(`?startVerse=${+firstVerseOnPage - 1}`, { replaceState: false });
	}

	// Set the current page to 'chapter'
	__currentPage.set('chapter');
</script>

<PageHead title={`${quranMetaData[$__chapterNumber].transliteration} (${$__chapterNumber})`} />

<div id="chapter-block">
	{#await chapterData}
		<Spinner />
	{:then}
		<Bismillah {startVerse} />

		<!-- need custom stylings if display type is 3 or 4 - continuous -->
		<div id="verses-block" class={selectableDisplays[JSON.parse($__userSettings).displaySettings.displayType].customClasses}>
			<!-- buttons to start chapter from start and load previous verse -->
			{#if startVerse > 1}
				<div class={loadPrevNextVerseButtons}>
					<a href="/{$__chapterNumber}" class="text-sm {buttonClasses}"> Start of {term('chapter')} </a>
					<button on:click={loadPreviousVerse} class="text-sm {buttonClasses}"> Previous {term('verse')} </button>
				</div>
			{/if}

			<Chapter {startVerse} {endVerse} />
		</div>
	{:catch error}
		<ErrorLoadingData {error} />
	{/await}
</div>
