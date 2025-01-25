<script>
	export let startIndex, endIndex;

	import Spinner from '$svgs/Spinner.svelte';
	import WordByWord from '$display/layouts/WordByWord.svelte';
	import Normal from '$display/layouts/Normal.svelte';
	import TranslationTransliteration from '$display/layouts/TranslationTransliteration.svelte';
	import Bismillah from '$display/Bismillah.svelte';
	import { __displayType, __fontType, __wordTranslation, __wordTransliteration, __keysToFetch, __keysToFetchData, __currentPage, __pageURL, __userSettings } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { fetchChapterData } from '$utils/fetchData';
	import { isValidVerseKey } from '$utils/validateKey';
	import { goto } from '$app/navigation';
	import { inview } from 'svelte-inview';
	import { onMount } from 'svelte';
	import { term } from '$utils/terminologies';
	import { selectableDisplays } from '$data/options';
	import { quranMetaData } from '$data/quranMeta';

	const dividerClasses = `
		flex flex-row justify-center text-center mx-auto w-full my-4 
		py-2 px-4 text-sm rounded-full
		${window.theme('hoverBorder')}
		${window.theme('bgSecondaryLight')}
	`;

	const displayComponents = {
		1: { component: WordByWord },
		2: { component: Normal },
		7: { component: TranslationTransliteration }
	};

	const maxIndexesAllowedToRender = 5;

	// Load button click options
	const loadButtonOptions = {
		rootMargin: '2000px',
		unobserveOnEnter: true
	};

	const params = new URLSearchParams(window.location.search);
	let Individual; // for the "Individual" component
	let nextVersesProps = {};
	let versesLoadType; // previous/next
	let keysArray = $__keysToFetch.split(',');
	let keysArrayLength = keysArray.length - 1;
	let nextStartIndex, nextEndIndex;
	let renderedVerses = 0;
	let showLoadPreviousVerseButton = false;
	let showContinueReadingButton = false;
	let dataMap = {};
	let keyToStartWith = null;
	let isLoading = false; // Tracks the loading state of dataMap

	// Only allow display types listed in displayComponents, else default to type 1, and don't save the layout in settings if not allowed
	$: if (!displayComponents.hasOwnProperty($__displayType)) {
		$__displayType = 1;
	}

	// Update the layout for the previous/next verse buttons
	$: loadPrevNextVerseButtons = `flex ${selectableDisplays[$__displayType].continuous ? 'flex-row-reverse' : 'flex-row'} space-x-4 justify-center`;

	// Checking if a start key was provided
	if (params.get('startKey') !== undefined || params.get('startKey') !== null) {
		try {
			keyToStartWith = params.get('startKey');

			if (isValidVerseKey(keyToStartWith)) {
				goto(removeParam('startKey'), { replaceState: false });
				startIndex = getIndexOfKey(keyToStartWith);
				endIndex = keysArrayLength > maxIndexesAllowedToRender ? startIndex + maxIndexesAllowedToRender : keysArrayLength;

				if (startIndex > 0) showLoadPreviousVerseButton = true;
			}
		} catch (error) {
			// ...
		}
	}

	// Set initial indexes if nothing was set earlier
	if (startIndex === undefined) startIndex = 0;
	if (endIndex === undefined) endIndex = keysArrayLength > maxIndexesAllowedToRender ? startIndex + maxIndexesAllowedToRender : keysArrayLength;
	// Basic checks
	if (startIndex < 0) startIndex = 0;
	if (endIndex > keysArrayLength) endIndex = keysArrayLength;

	function loadNextVerses() {
		try {
			import('./Individual.svelte').then((res) => (Individual = res.default));
			const lastRenderedId = document.querySelectorAll('.verse')[document.querySelectorAll('.verse').length - 1].id;

			nextStartIndex = findKeyIndices($__keysToFetch, lastRenderedId, maxIndexesAllowedToRender).startIndex;
			nextEndIndex = findKeyIndices($__keysToFetch, lastRenderedId, maxIndexesAllowedToRender).endIndex;

			// don't let the end index be more than the data object's length
			if (nextEndIndex === -1) nextEndIndex = Object.keys($__keysToFetch).length;

			// Remove the existing button
			document.getElementById('loadVersesButton').remove();

			// Setting the nextVersesProps
			nextVersesProps = {
				startIndex: nextStartIndex,
				endIndex: nextEndIndex
			};

			versesLoadType = 'next';
		} catch (error) {
			console.log(error);
		}
	}

	function findKeyIndices(keyString, key, threshold) {
		// Convert the comma-separated string into an array
		let keys = keyString.split(',');

		// Find the index of the given key
		let keyIndex = keys.indexOf(key);

		if (keyIndex === -1) {
			return { startIndex: -1, endIndex: -1 };
		}

		// Calculate start and end indices
		let startIndex = keyIndex + 1;
		let endIndex = Math.min(keyIndex + threshold, keys.length - 1);

		return { startIndex, endIndex };
	}

	function getIndexOfKey(key, keysString = $__keysToFetch) {
		const keysArray = keysString.split(',');
		let index = keysArray.indexOf(key);
		if (index === -1) index = 0;
		return index;
	}

	function removeParam(param) {
		const parsedUrl = new URL(window.location.href);
		parsedUrl.searchParams.delete(param);
		return parsedUrl.toString();
	}

	function versesRendered() {
		renderedVerses += 1;

		if (renderedVerses === endIndex + 1 - startIndex) {
			showContinueReadingButton = true;
		}
	}

	function gotoPreviousVerse(previousKey) {
		goto(`?startKey=${previousKey}`, { replaceState: false });
		__pageURL.set(Math.random());
	}

	async function fetchAllChapterData() {
		isLoading = true; // Start loading
		try {
			const promises = Array.from(Array(endIndex + 1).keys())
				.slice(startIndex)
				.map(async (index) => {
					const chapterKey = keysArray[index].split(':')[0];

					if (__keysToFetchData.hasOwnProperty(chapterKey)) {
						// Return cached data if available
						return __keysToFetchData[chapterKey];
					} else {
						// Fetch from API
						const data = await fetchChapterData({ chapter: chapterKey });
						return data;
					}
				});

			const results = await Promise.all(promises);

			// Update dataMap
			results.forEach((data, i) => {
				const index = startIndex + i;
				const key = keysArray[index];
				dataMap[key] = data[key];
			});
		} catch (error) {
			console.error('Error fetching chapter data:', error);
		} finally {
			isLoading = false; // End loading
		}
	}

	// Initial fetching / re-fetch the data if any of these changes
	$: if ($__fontType || $__wordTranslation || $__wordTransliteration) {
		fetchAllChapterData();
	}
</script>

{#key dataMap}
	{#if isLoading}
		<Spinner />
	{:else}
		{#if showLoadPreviousVerseButton}
			{@const previousKey = keysArray[getIndexOfKey(keyToStartWith) - 1]}
			<div class={loadPrevNextVerseButtons}>
				<button class="text-sm {buttonClasses}" on:click={() => __pageURL.set(Math.random())}>Start of {term('juz')}</button>
				<button class="text-sm {buttonClasses}" on:click={() => gotoPreviousVerse(previousKey)}>Previous {term('verse')}</button>
			</div>
		{/if}

		{#if Object.keys(dataMap).length === endIndex - startIndex + 1}
			{#each Array.from(Array(endIndex + 1).keys()).slice(startIndex) as index}
				{@const key = keysArray[index]}
				{@const value = dataMap[key]}

				<!-- Only show Bismillah when its the Juz page -->
				{#if $__currentPage === 'juz' && +key.split(':')[1] === 1}
					{@const chapter = +key.split(':')[0]}
					<div class="mt-4">
						<div class={dividerClasses}>{term('chapter')} {chapter} - {quranMetaData[chapter].transliteration}</div>
						<Bismillah {chapter} startVerse={+key.split(':')[1]} />
					</div>
				{/if}

				<section use:versesRendered>
					<svelte:component this={displayComponents[$__displayType]?.component} {key} {value} />
				</section>
			{/each}
		{/if}

		{#if showContinueReadingButton}
			{#if endIndex < keysArrayLength && document.getElementById('loadVersesButton') === null}
				<div id="loadVersesButton" class="flex justify-center pt-6 pb-18" use:inview={loadButtonOptions} on:inview_enter={(event) => document.querySelector('#loadVersesButton > button').click()}>
					<button on:click={loadNextVerses} class="text-sm {buttonClasses}"> Continue Reading </button>
				</div>
			{/if}
		{/if}

		{#if versesLoadType === 'next'}
			<svelte:component this={Individual} {...nextVersesProps} />
		{/if}
	{/if}
{/key}
