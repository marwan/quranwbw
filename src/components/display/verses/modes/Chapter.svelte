<script>
	export let startVerse;
	export let endVerse;
	export let isExampleVerse = undefined;

	import WordByWord from '$display/layouts/WordByWord.svelte';
	import Normal from '$display/layouts/Normal.svelte';
	import Continuous from '$display/layouts/Continuous.svelte';
	import SideBySide from '$display/layouts/SideBySide.svelte';
	import TranslationTransliteration from '$display/layouts/TranslationTransliteration.svelte';
	import { inview } from 'svelte-inview';
	import { quranMetaData } from '$data/quranMeta';
	import { __currentPage, __userSettings, __displayType, __chapterNumber, __chapterData, __chapterDataLoaded } from '$utils/stores';
	import { buttonOutlineClasses } from '$data/commonClasses';

	// Load button click options
	const loadButtonOptions = {
		rootMargin: '2000px',
		unobserveOnEnter: true
	};

	const displayComponents = {
		1: { component: WordByWord },
		2: { component: Normal },
		3: { component: Continuous },
		4: { component: Continuous },
		5: { component: SideBySide },
		// 6 is Mushaf mode which is handled differently
		7: { component: TranslationTransliteration }
	};

	const urlParams = new URLSearchParams(window.location.search);
	const startVerseParam = urlParams.get('startVerse');
	const chapterTotalVerses = quranMetaData[$__chapterNumber].verses;
	let Chapter; // for the "Chapter" component
	let versesLoadType; // previous/next
	let nextVersesProps = {};
	let nextVersesStart;
	let nextVersesEnd;

	// Function to load the next set of verses
	function loadNextVerses() {
		versesLoadType = 'next';

		// Importing the same component to be re-used when the "Load Next Verses" button is pressed
		import('./Chapter.svelte').then((res) => (Chapter = res.default));

		// Max verses to load when the next set is requested
		const versesToLoad = 5;

		// Get the last verse number from last prop value
		const versesOnPage = document.getElementsByClassName('verse');
		const lastVerseOnPage = +versesOnPage[versesOnPage.length - 1].id.split(':')[1];

		// Remove the existing button
		document.getElementById('loadVersesButton').remove();

		// Define the new starting and ending range
		nextVersesStart = lastVerseOnPage + 1;
		nextVersesEnd = Math.min(nextVersesStart + versesToLoad, chapterTotalVerses);

		// Setting the nextVersesProps
		nextVersesProps = {
			startVerse: nextVersesStart,
			endVerse: nextVersesEnd
		};
	}

	// If the startVerse parameter was set, overide the current start and end verse
	if (
		startVerseParam !== null && // Ensure it's not null
		startVerseParam !== undefined && // Ensure it's not undefined
		startVerseParam.trim() !== '' && // Ensure it's not empty
		!isNaN(startVerseParam) // Ensure it's a valid number
	) {
		nextVersesProps = {
			startVerse: Number(startVerseParam),
			endVerse: Number(startVerseParam)
		};
	}
</script>

{#if $__currentPage === 'chapter' && $__chapterData}
	{#each Array.from(Array(endVerse + 1).keys()).slice(startVerse) as verse}
		<svelte:component this={displayComponents[JSON.parse($__userSettings).displaySettings.displayType].component} key={`${$__chapterNumber}:${verse}`} value={$__chapterData[`${$__chapterNumber}:${verse}`]} />
	{/each}

	<!-- if the verses are being shown to the user in a modal/drawer, then do not show the loadNextVersesButton -->
	{#if isExampleVerse === undefined}
		<!-- only show the button when the last verse on page is less than total verses in chapter -->
		<!-- invisible for now... -->
		{#if endVerse < chapterTotalVerses && document.getElementById('loadVersesButton') === null}
			<div id="loadVersesButton" class="flex justify-center pt-6 pb-18 invisible" use:inview={loadButtonOptions} on:inview_enter={(event) => document.querySelector('#loadVersesButton > button').click()}>
				<button on:click={loadNextVerses} class="text-sm {buttonOutlineClasses}"> Continue Reading </button>
			</div>
		{/if}
	{/if}

	{#if versesLoadType === 'next'}
		<svelte:component this={Chapter} {...nextVersesProps} />
	{/if}
{/if}
