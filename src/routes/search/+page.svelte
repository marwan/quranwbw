<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { goto } from '$app/navigation';
	import { __currentPage } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { quranMetaData } from '$data/quranMeta';
	import { fade } from 'svelte/transition';
	import { checkOnlineAndAlert } from '$utils/offlineModeHandler';

	// Public client-side API key (origin-restricted on API provider side)
	const kalimatPublicApiKey = import.meta.env.VITE_KALIMAT_PUBLIC_API_KEY;

	const linkClasses = 'w-fit flex flex-row space-x-2 py-4 px-4 rounded-xl items-center cursor-pointer border border-transparent hover:border-theme-accent bg-theme-accent/5';
	const linkTextClasses = 'text-xs md:text-sm text-left w-fit capitalize truncate';

	const params = new URLSearchParams(window.location.search);
	let searchQuery = params.get('query') === null || params.get('query') === '' ? '' : params.get('query');
	let fetchingNewData = false;
	let resultsFound = false;
	let badRequest = false;
	let navigationResults = [];
	let resultKeys;
	let totalResults = 0;

	// Cache object to store search results (keyed by query, stores combined results)
	let searchCache = {};

	// Single reactive statement for search
	$: if (searchQuery.length > 0) {
		setVerseKeys();
	}

	// Fetch results from the Kalimat semantic search API
	async function fetchKalimatResults(query) {
		try {
			const response = await fetch(`https://api.kalimat.dev/search?query=${query}&numResults=10`, {
				headers: {
					'x-api-key': kalimatPublicApiKey
				}
			});

			if (response.status !== 200) return null;

			return await response.json();
		} catch (error) {
			// Log but don't throw — a Kalimat failure should not block Quran Cloud results
			console.warn('[Kalimat API] fetch failed:', error);
			return null;
		}
	}

	// Fetch results from the Quran Cloud keyword search API (English translations)
	// Returns an array of "chapter:verse" key strings, or [] on 404/error
	async function fetchQuranCloudKeys(query) {
		try {
			const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);

			// 404 means no matches found — treat as empty, not an error
			if (response.status === 404) return [];

			if (response.status !== 200) return [];

			const json = await response.json();

			// Guard against unexpected response shape
			if (!json?.data?.matches || !Array.isArray(json.data.matches)) return [];

			// Convert each match to a "chapter:verse" key and deduplicate within this API's results
			const keySet = new Set();
			for (const match of json.data.matches) {
				const chapter = match?.surah?.number;
				const verse = match?.numberInSurah;

				// Skip malformed entries
				if (!chapter || !verse) continue;

				keySet.add(`${chapter}:${verse}`);
			}

			return Array.from(keySet);
		} catch (error) {
			// Log but don't throw — a Quran Cloud failure should not block Kalimat results
			console.warn('[Quran Cloud API] fetch failed:', error);
			return [];
		}
	}

	// Fetch both APIs in parallel and return combined, deduplicated results
	// Returns null if both APIs fail, otherwise { navigationItems, combinedVerseKeys }
	async function fetchAllResults(query) {
		// Fire both requests at the same time — neither waits for the other
		const [kalimatData, quranCloudKeys] = await Promise.all([fetchKalimatResults(query), fetchQuranCloudKeys(query)]);

		// If both APIs failed, signal a total failure to the caller
		if (kalimatData === null && quranCloudKeys.length === 0) return null;

		// Extract verse keys from Kalimat results
		const { verseKeys: kalimatVerseKeys, navigationItems } = processKalimatResults(kalimatData);

		// Merge keys from both APIs into a Set to automatically remove duplicates
		const mergedKeySet = new Set([...kalimatVerseKeys, ...quranCloudKeys]);
		const combinedVerseKeys = Array.from(mergedKeySet);

		return { navigationItems, combinedVerseKeys };
	}

	// Get results from cache or fetch from both APIs
	async function getSearchResults(query) {
		// Return cached combined result if available
		if (searchCache[query]) {
			updateURL(query);
			return searchCache[query];
		}

		const result = await fetchAllResults(query);

		// Cache the combined result for this query
		searchCache[query] = result;
		updateURL(query);
		return result;
	}

	// Function to update URL
	function updateURL(query) {
		if (query && query.length > 0) {
			goto(`/search?query=${query}`, { replaceState: false });
		}
	}

	// Process only the Kalimat API response to extract verse keys and navigation items
	// (Quran Cloud keys are already plain "chapter:verse" strings, no processing needed)
	function processKalimatResults(data) {
		if (!data || !Array.isArray(data)) return { verseKeys: [], navigationItems: [] };

		const verseKeys = [];
		const navigationItems = [];

		data.forEach((item) => {
			if (item.type === 'quran_verse') {
				verseKeys.push(item.id);
			} else {
				// For navigation items, remove alphabet prefix from id
				let processedId = item.id;
				if (item.type === 'quran_page') {
					processedId = item.id.replace(/^p/, '');
				} else if (item.type === 'quran_juz') {
					processedId = item.id.replace(/^j/, '');
				}

				navigationItems.push({
					...item,
					processedId: processedId
				});
			}
		});

		return { verseKeys, navigationItems };
	}

	// Update the search query if enter is pressed or search icon is clicked
	async function updateSearchQuery(query) {
		if (!(await checkOnlineAndAlert())) return;
		searchQuery = query;
	}

	// Fetch results from both APIs, then update the reactive display variables
	async function setVerseKeys() {
		fetchingNewData = true;
		badRequest = false;

		const result = await getSearchResults(searchQuery);

		if (result) {
			const { navigationItems, combinedVerseKeys } = result;

			navigationResults = navigationItems;

			// Total results = unique verse keys + navigation items
			totalResults = combinedVerseKeys.length + navigationItems.length;
			resultsFound = combinedVerseKeys.length > 0 || navigationItems.length > 0;

			// Sort the final merged verse keys before passing to the display component
			resultKeys = combinedVerseKeys.length > 0 ? sortVerseKeys(combinedVerseKeys) : null;
		}

		// Both APIs returned no usable data
		else {
			badRequest = true;
			navigationResults = [];
			totalResults = 0;
			resultsFound = false;
			resultKeys = null;
		}

		fetchingNewData = false;
	}

	// Utility function to sort an array of verse keys in ascending chapter and verse order
	function sortVerseKeys(verseKeys) {
		return verseKeys.sort((a, b) => {
			const [chapterA, verseA] = a.split(':').map(Number);
			const [chapterB, verseB] = b.split(':').map(Number);

			// First compare chapter, then verse
			if (chapterA === chapterB) {
				return verseA - verseB;
			}
			return chapterA - chapterB;
		});
	}

	// Function to generate the correct link based on result type
	function getNavigationLink(item) {
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
		const linkMap = {
			quran_chapter: [`${term('chapter')} ${quranMetaData[item.processedId]?.transliteration} (${item.processedId})`, `${baseUrl}/${item.processedId}`],
			quran_page: [`Page ${item.processedId}`, `${baseUrl}/page?id=${item.processedId}`],
			quran_juz: [`Juz ${item.processedId}`, `${baseUrl}/juz?id=${item.processedId}`],
			quran_range: [`${item.processedId}`, `${baseUrl}/${item.processedId}`]
		};

		return linkMap[item.type] || ['#', '#']; // Fallback to '#' if no match
	}

	__currentPage.set('search');
</script>

<PageHead title={'Search'} />

<div class="mt-4 space-y-4">
	<div class="flex max-w-xl mx-auto">
		<!-- search input form -->
		<form on:submit|preventDefault={() => updateSearchQuery(document.getElementById('search-input').value)} class="flex items-center w-full">
			<div class="relative w-full">
				<input type="search" id="search-input" value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-l-3xl w-full z-20 text-sm border placeholder:text-theme-accent/50 border-theme-accent/20 focus:border-theme-accent focus:ring-theme-accent" placeholder="Search Ibrahim, Mary, Jannat, كتاب..." required />
			</div>
			<button type="submit" title="Search" class="py-4 px-5 rounded-r-3xl items-center border border-theme-accent/20 bg-theme-accent/5">
				<Search2 size={5} />
			</button>
		</form>
	</div>

	<!-- search instructions -->
	{#if searchQuery.length === 0}
		<div id="how-to-search" class="flex flex-col text-center text-xs space-y-2 max-w-2xl mx-auto">
			<span>Search for any text, regardless of English or Arabic terminology, and find the nearest or related results. </span>
		</div>
	{/if}

	{#if searchQuery.length > 0}
		{#if badRequest}
			<ErrorLoadingData center="false" />
		{:else if !badRequest && fetchingNewData}
			<Spinner />
		{:else}
			<div id="search-block">
				<div id="search-results-information" class="text-center text-xs">
					{#if resultsFound}
						<span>Showing {totalResults} {totalResults === 1 ? 'result' : 'results'} related to "{searchQuery}".</span>
					{:else if !resultsFound && navigationResults.length === 0}
						<div class="flex text-center items-center justify-center pt-18 text-xs max-w-2xl mx-auto">Unfortunately, your query did not yield any results. Please try using a different keyword.</div>
					{/if}
				</div>

				{#if navigationResults.length > 0}
					<div id="navigation-results" class="flex flex-wrap space-x-4 justify-center mt-6">
						{#each navigationResults as item}
							{@const [itemTitle, itemLink] = getNavigationLink(item)}
							<a href={itemLink} target="_blank" class="{linkClasses} my-1">
								<span class={linkTextClasses}>{itemTitle} {@html '&#8599;'}</span>
							</a>
						{/each}
					</div>
				{/if}

				<div id="individual-verses-block" in:fade={{ duration: 300 }}>
					{#key resultKeys}
						{#if resultKeys}
							<FullVersesDisplay keys={resultKeys.toString()} />
						{/if}
					{/key}
				</div>
			</div>
		{/if}
	{/if}
</div>
