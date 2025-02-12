<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Translation from '$svgs/Translation.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import Individual from '$display/verses/modes/Individual.svelte';
	import VerseTranslationSelector from '$ui/SettingsDrawer/VerseTranslationSelector.svelte';
	import { goto } from '$app/navigation';
	import { __currentPage, __fontType, __wordTranslation, __wordTransliteration, __verseTranslations, __settingsSelectorModal, __keysToFetch } from '$utils/stores';
	import { apiEndpoint } from '$data/websiteSettings';
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';
	import { selectableVerseTranslations } from '$data/options';

	const params = new URLSearchParams(window.location.search);
	let searchQuery = params.get('query') === null || params.get('query') === '' ? '' : params.get('query'); // Search text
	let searchPage = params.get('page') === null || params.get('page') === '' ? 1 : +params.get('page'); // Selected page
	let previousSearchQuery = '';
	let resultsPerPage = 50;
	let totalResults;
	let pagePagination = null;
	let pageChanged = false;
	let fetchingNewData = false;
	let resultsFound = false;
	let badRequest = false;

	__keysToFetch.set(null);

	// Basic checks
	$: if (searchPage < 1 || isNaN(searchPage)) searchPage = 1;

	// Update the search results whenever query changes
	$: if (searchQuery.length > 0) goto(`/search?query=${searchQuery}&page=${searchPage}`, { replaceState: false });

	// Get and set the new verse keys when the search term or page is changed
	$: if (searchQuery.length > 0 || (searchPage && pageChanged === true)) setVerseKeys();

	// Get verse keys from the API
	async function getVerseKeys(searchQuery) {
		try {
			let response = await fetch(`${apiEndpoint}/search/translations?query=${searchQuery}&size=${resultsPerPage}&page=${searchPage}`);
			if (response.status !== 200) return (badRequest = true);
			let data = await response.json();
			let versesKeyData = data;
			const { pagination } = versesKeyData;
			totalResults = pagination.total_records;
			pagePagination = pagination;
			return generateKeys(versesKeyData);
		} catch (error) {
			console.error('Error fetching verse keys:', error);
			badRequest = true;
		}
	}

	// Generate keys from the API response (string format, after parsing)
	function generateKeys(data) {
		const verseKeys = [];

		// Check if navigation exists and has a valid entry
		if (data.result.navigation && data.result.navigation.length > 0) {
			const firstItem = data.result.navigation[0];

			// Check if result_type is 'ayah'
			if (firstItem.result_type === 'ayah') {
				verseKeys.push(firstItem.key);
				return verseKeys.toString();
			}
		}

		// If not 'ayah', check verses and extract their keys
		if (data.result.verses && Array.isArray(data.result.verses) && data.result.verses.length > 0) {
			data.result.verses.forEach(function (verse) {
				verseKeys.push(verse.verse_key);
			});
		}

		return verseKeys.toString();
	}

	// Update the search query if enter is pressed or search icon is clicked
	async function updateSearchQuery(query) {
		previousSearchQuery = searchQuery;
		searchQuery = query;
		if (previousSearchQuery !== searchPage) searchPage = 1;
		setVerseKeys();
	}

	async function setVerseKeys() {
		fetchingNewData = true;
		badRequest = false;
		const keys = await getVerseKeys(searchQuery);
		resultsFound = keys === null || keys === '' ? false : true;
		__keysToFetch.set(keys);
		fetchingNewData = false;
	}

	// Make a random hit to the search endpoint to warm it
	fetch(`${apiEndpoint}/search/translations?query=mary&random_id=${Math.floor(10000 + Math.random() * 90000)}&bypass_cache=true`);

	__currentPage.set('search');
</script>

<PageHead title={'Search'} />

<div class="mt-4 space-y-4">
	<div class="flex max-w-2xl mx-auto">
		<button class="py-3 pl-6 pr-4 rounded-l-3xl items-center border {window.theme('border')} {window.theme('bgSecondaryLight')}" title="Translations" on:click={() => __settingsSelectorModal.set({ component: VerseTranslationSelector, visible: true, title: `${term('verse')} Translation` })}>
			<Translation size={5} />
		</button>

		<!-- search input form -->
		<form on:submit|preventDefault={() => updateSearchQuery(document.getElementById('search-input').value)} class="flex items-center w-full">
			<div class="relative w-full">
				<input type="search" id="search-input" value={searchQuery} class="bg-transparent block py-4 pl-4 w-full z-20 text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search Ibrahim, Mary, Jannat, كتاب..." required />
			</div>
			<button type="submit" title="Search" class="py-4 px-5 rounded-r-3xl items-center border {window.theme('border')} {window.theme('bgSecondaryLight')}">
				<Search2 size={5} />
			</button>
		</form>
	</div>

	<!-- search instructions -->
	{#if searchQuery.length === 0}
		<div id="how-to-search" class="flex flex-col text-center text-xs space-y-2 max-w-2xl mx-auto">
			<span>Explore {Object.keys(selectableVerseTranslations).length} translations from diverse languages and authors. Search for any text, regardless of English or Arabic terminology, and find the nearest or related results. Additionally, you can display specific translations using the button on the left. </span>
		</div>
	{/if}

	{#if searchQuery.length > 0}
		{#if badRequest}
			<div class="flex text-center items-center justify-center pt-18 text-xs max-w-2xl mx-auto">Something went wrong.</div>
		{:else if !badRequest && fetchingNewData}
			<Spinner />
		{:else}
			<div id="search-block">
				<div id="search-results-information" class="text-center text-xs">
					{#if resultsFound}
						<span>Showing {totalResults}</span>
						<span>{totalResults === 1 ? 'result' : 'results'} related to</span>
						{#key pagePagination}
							{#if pagePagination.total_pages > 1}
								"{searchQuery}"
								<span>(page {pagePagination.current_page}).</span>
							{:else}
								"{searchQuery}".
							{/if}
						{/key}
					{:else}
						<div class="flex text-center items-center justify-center pt-18 text-xs max-w-2xl mx-auto">Unfortunately, your query did not yield any results. Please try using a different keyword.</div>
					{/if}
				</div>

				<div id="individual-verses-block">
					{#key $__keysToFetch}
						{#if $__keysToFetch}
							<Individual />
						{/if}
					{/key}
				</div>

				{#if pagePagination !== null}
					<div class="flex flex-row space-x-4 mt-8 justify-center">
						{#if pagePagination.current_page > 1}
							<button
								class="{buttonOutlineClasses} text-xs"
								on:click={() => {
									searchPage = pagePagination.current_page - 1;
									pageChanged = true;
								}}>{@html '&#x2190;'} {pagePagination.current_page - 1}</button
							>
						{/if}

						{#if pagePagination.total_pages > 1}
							<button>Page {pagePagination.current_page}</button>
						{/if}

						{#if pagePagination.next_page !== null}
							<button
								class="{buttonOutlineClasses} text-xs"
								on:click={() => {
									searchPage = pagePagination.next_page;
									pageChanged = true;
								}}>{pagePagination.next_page} {@html '&#x2192;'}</button
							>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
