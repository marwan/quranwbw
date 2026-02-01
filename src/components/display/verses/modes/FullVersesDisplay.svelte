<script>
	export let keys, startIndex, endIndex;

	import Spinner from '$svgs/Spinner.svelte';
	import WordByWord from '$display/layouts/WordByWord.svelte';
	import Normal from '$display/layouts/Normal.svelte';
	import TranslationTransliteration from '$display/layouts/TranslationTransliteration.svelte';
	import Bismillah from '$misc/Bismillah.svelte';
	import ChapterHeader from '$misc/ChapterHeader.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __displayType, __fontType, __wordTranslation, __wordTransliteration, __currentPage, __keysToFetch, __pageURL } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { fetchChapterData } from '$utils/fetchData';
	import { isValidVerseKey } from '$utils/validateKey';
	import { goto } from '$app/navigation';
	import { inview } from 'svelte-inview';
	import { term } from '$utils/terminologies';
	import { selectableDisplays } from '$data/options';

	// set this so we can use it for the 'setPlayFromHere' functionality in the audio modal
	$: $__keysToFetch = keys;

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
	let nextVersesProps = {};
	let versesLoadType; // previous/next
	let keysArray = keys.split(',');
	let keysArrayLength = keysArray.length - 1;
	let keysData = {};
	let nextStartIndex, nextEndIndex;
	let renderedVerses = 0;
	let showLoadPreviousVerseButton = false;
	let showContinueReadingButton = false;
	let dataMap = {};
	let keyToStartWith = null;
	let isLoading = false; // Tracks the loading state of dataMap
	let fetchError = null; // Tracks for any data fetch errors

	// Only allow display types listed in displayComponents, else default to type 1, and don't save the layout in settings if not allowed
	$: if (!Object.prototype.hasOwnProperty.call(displayComponents, $__displayType)) {
		$__displayType = 1;
	}

	// Update the layout for the previous/next verse buttons
	$: loadPrevNextVerseButtons = `flex ${selectableDisplays[$__displayType].continuous ? 'flex-row-reverse' : 'flex-row'} space-x-4 justify-center`;

	// Checking if a start key was provided
	if (params.get('startKey') !== undefined || params.get('startKey') !== null) {
		try {
			keyToStartWith = params.get('startKey');

			if (isValidVerseKey(keyToStartWith)) {
				const parsedUrl = new URL(window.location.href);
				parsedUrl.searchParams.delete('startKey');
				goto(parsedUrl.toString(), { replaceState: false });
				startIndex = getIndexOfKey(keyToStartWith);
				endIndex = keysArrayLength > maxIndexesAllowedToRender ? startIndex + maxIndexesAllowedToRender : keysArrayLength;

				if (startIndex > 0) showLoadPreviousVerseButton = true;
			}
		} catch (error) {
			console.warn(error);
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
			const lastRenderedId = document.querySelectorAll('.verse')[document.querySelectorAll('.verse').length - 1].id;

			nextStartIndex = findKeyIndices(keys, lastRenderedId, maxIndexesAllowedToRender).startIndex;
			nextEndIndex = findKeyIndices(keys, lastRenderedId, maxIndexesAllowedToRender).endIndex;

			// don't let the end index be more than the data object's length
			if (nextEndIndex === -1) nextEndIndex = Object.keys(keys).length;

			// Remove the existing button
			document.getElementById('loadVersesButton').remove();

			// Setting the nextVersesProps
			nextVersesProps = {
				keys,
				startIndex: nextStartIndex,
				endIndex: nextEndIndex
			};

			versesLoadType = 'next';
		} catch (error) {
			console.warn(error);
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

	function getIndexOfKey(key, keysString = keys) {
		const keysArray = keysString.split(',');
		let index = keysArray.indexOf(key);
		if (index === -1) index = 0;
		return index;
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

	/**
	 * Fetches chapter data for a given range of verse keys.
	 *
	 * This function:
	 * 1. Extracts the relevant verse keys from `keysArray` using `startIndex` and `endIndex`.
	 * 2. Identifies unique chapter numbers from those keys.
	 * 3. Checks if data for each chapter is already cached in `keysData`.
	 *    - If cached, uses the cached data.
	 *    - If not, fetches the chapter data using `fetchChapterData`.
	 * 4. Resolves all chapter data fetches in parallel.
	 * 5. Maps the full verse keys (e.g., "1:2") to their corresponding data in `dataMap`.
	 *
	 * This ensures that each chapter's data is fetched only once, even if multiple verses
	 * from the same chapter are requested.
	 */
	async function fetchAllChapterData() {
		isLoading = true;
		fetchError = null;

		try {
			// Step 1: Slice relevant keys and extract unique chapter keys
			const relevantKeys = keysArray.slice(startIndex, endIndex + 1);
			const uniqueChapters = new Set(relevantKeys.map((key) => key.split(':')[0]));

			// Step 2: Build fetch promises for only uncached chapters
			const chapterFetchPromises = {};
			for (const chapter of uniqueChapters) {
				if (Object.prototype.hasOwnProperty.call(keysData, chapter)) {
					chapterFetchPromises[chapter] = keysData[chapter];
				} else {
					chapterFetchPromises[chapter] = fetchChapterData({ chapter });
				}
			}

			// Step 3: Resolve all chapter fetches in parallel
			const chapterDataEntries = await Promise.all(
				Object.entries(chapterFetchPromises).map(async ([chapter, promise]) => {
					const data = await promise;
					return [chapter, data];
				})
			);

			// Step 4: Build a map of chapter -> data
			const fetchedDataMap = Object.fromEntries(chapterDataEntries);

			// Step 5: Map the original keys to the fetched data
			relevantKeys.forEach((fullKey) => {
				const chapter = fullKey.split(':')[0];
				dataMap[fullKey] = fetchedDataMap[chapter][fullKey];
			});
		} catch (error) {
			fetchError = error;
			console.warn('Error fetching chapter data:', error);
		} finally {
			isLoading = false;
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
	{:else if fetchError}
		<ErrorLoadingData error={fetchError} />
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
						<ChapterHeader {chapter} />
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
				<div id="loadVersesButton" class="flex justify-center pt-6 pb-18" use:inview={loadButtonOptions} on:inview_enter={() => document.querySelector('#loadVersesButton > button').click()}>
					<button on:click={loadNextVerses} class="text-sm {buttonClasses}"> Continue Reading </button>
				</div>
			{/if}
		{/if}

		{#if versesLoadType === 'next'}
			<svelte:self {...nextVersesProps} />
		{/if}
	{/if}
{/key}
