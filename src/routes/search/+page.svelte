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
	import { checkOnlineAndAlert } from '$utils/serviceWorkerHandler';

	const API_KEY = import.meta.env.VITE_KALIMAT_API_KEY;

	const linkClasses = `w-fit flex flex-row space-x-2 py-4 px-4 rounded-xl items-center cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const linkTextClasses = 'text-xs md:text-sm text-left w-fit capitalize truncate';

	const params = new URLSearchParams(window.location.search);
	let searchQuery = params.get('query') === null || params.get('query') === '' ? '' : params.get('query');
	let fetchingNewData = false;
	let resultsFound = false;
	let badRequest = false;
	let navigationResults = [];
	let resultKeys;
	let totalResults = 0;

	// Cache object to store search results
	let searchCache = {};

	// Single reactive statement for search
	$: if (searchQuery.length > 0) {
		setVerseKeys();
	}

	// Get results from cache or API
	async function getSearchResults(searchQuery) {
		// Check cache first
		if (searchCache[searchQuery]) {
			updateURL(searchQuery);
			return searchCache[searchQuery];
		}

		try {
			const response = await fetch(`https://api.kalimat.dev/search?query=${searchQuery}&numResults=50`, {
				headers: {
					'x-api-key': API_KEY
				}
			});

			if (response.status !== 200) {
				badRequest = true;
				return null;
			}

			const data = await response.json();
			searchCache[searchQuery] = data;
			updateURL(searchQuery);
			return data;
		} catch (error) {
			console.warn('Error fetching search results:', error);
			badRequest = true;
			return null;
		}
	}

	// Function to update URL
	function updateURL(query) {
		if (query && query.length > 0) {
			goto(`/search?query=${query}`, { replaceState: false });
		}
	}

	// Process the API response and separate navigation items from verse keys
	function processSearchResults(data) {
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

	async function setVerseKeys() {
		fetchingNewData = true;
		badRequest = false;

		const data = await getSearchResults(searchQuery);

		if (data) {
			const { verseKeys, navigationItems } = processSearchResults(data);

			navigationResults = navigationItems;
			totalResults = data.length;
			resultsFound = verseKeys.length > 0 || navigationItems.length > 0;

			// Set verse keys for the Individual component
			resultKeys = verseKeys.length > 0 ? sortVerseKeys(verseKeys) : null;
		} else {
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
			quran_page: [`Page ${item.processedId}`, `${baseUrl}/page/${item.processedId}`],
			quran_juz: [`Juz ${item.processedId}`, `${baseUrl}/juz/${item.processedId}`],
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
				<input type="search" id="search-input" value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-l-3xl w-full z-20 text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search Ibrahim, Mary, Jannat, كتاب..." required />
			</div>
			<button type="submit" title="Search" class="py-4 px-5 rounded-r-3xl items-center border {window.theme('border')} {window.theme('bgSecondaryLight')}">
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
						<span>Showing {totalResults >= 50 ? 'top ' : ''}{totalResults} {totalResults === 1 ? 'result' : 'results'} related to "{searchQuery}".</span>
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
