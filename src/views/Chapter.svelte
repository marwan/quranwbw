<script>
	export let data, startVerse, endVerse;

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
	import { fade } from 'svelte/transition';

	let chapterData;
	let loaded = false;

	// Fetch chapter data only when chapter number or font/translation settings change
	$: {
		__chapterNumber.set(+data.chapter);
		chapterData = fetchChapterData({ chapter: $__chapterNumber });
		chapterData.then(() => { loaded = true; });

		// Re-run when font or translation settings change (triggers re-fetch)
		if ($__displayType || $__fontType || $__wordTranslation || $__wordTransliteration) {
			// Do nothing except re-run the block
		}
	}

	// Parse URL separately — no re-fetch needed on verse navigation
	$: {
		[startVerse, endVerse] = parseURL();
		__firstVerseOnPage.set(startVerse);

		if ($page.url.href) {
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

	__currentPage.set('chapter');
</script>

<PageHead title={`${quranMetaData[$__chapterNumber].transliteration} (${$__chapterNumber}${$page.url.searchParams.get('startVerse') || data.verse ? ':' + startVerse : ''})`} description={`Read Chapter ${$__chapterNumber} ${quranMetaData[$__chapterNumber].transliteration} of the Quran ${startVerse ? 'starting from ' + term('verse') + ' ' + startVerse : ''}.`} />

{#await chapterData}
	{#if !loaded}
		<Spinner />
	{/if}
{:then}
	<div id="chapter-block" in:fade={{ duration: 300 }}>
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
	</div>
{:catch error}
	<ErrorLoadingData {error} />
{/await}
