<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import Cross from '$svgs/Cross.svelte';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';
	import { debounce } from '$utils/debounce';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';

	let indexes = {};
	let allIndexes = [];
	let filteredIndexes = [];
	let searchQuery = '';
	let debouncedSearch = '';
	let isSearching = false;
	let selectedLetter = '';

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	let groupedIndexes = {};

	$: {
		groupedIndexes = {};
		for (const [index, verses] of filteredIndexes) {
			const firstLetter = index[0].toUpperCase();
			if (!groupedIndexes[firstLetter]) {
				groupedIndexes[firstLetter] = [];
			}
			groupedIndexes[firstLetter].push([index, verses]);
		}
	}

	// Debounce handler
	function updateDebouncedSearch() {
		isSearching = true;
		debounce(() => {
			debouncedSearch = searchQuery.trim().toLowerCase();
			isSearching = false;
		}, 500);
	}

	// Run this whenever searchQuery changes
	$: searchQuery, updateDebouncedSearch();

	// Filter indexes on debouncedSearch and selectedLetter
	$: filteredIndexes = allIndexes
		.filter(([index]) => {
			const matchesSearch = debouncedSearch ? index.toLowerCase().includes(debouncedSearch) : true;
			const matchesLetter = selectedLetter ? index[0].toUpperCase() === selectedLetter : true;
			return matchesSearch && matchesLetter;
		})
		.sort((a, b) => a[0].localeCompare(b[0]));

	function selectLetter(letter) {
		// selectedLetter = selectedLetter === letter ? '' : letter;
		searchQuery = letter;
	}

	function clearSearch() {
		searchQuery = '';
		selectedLetter = '';
	}

	function updateSearchQuery(value) {
		searchQuery = value;
		selectedLetter = '';
	}

	onMount(async () => {
		indexes = await fetchAndCacheJson(`${staticEndpoint}/others/quran-topics.json?version=1`, 'other');
		allIndexes = Object.entries(indexes);
	});

	__currentPage.set('index');
</script>

<PageHead title="Index" />

<div class="mx-auto max-w-6xl">
	<!-- Search Input -->
	<div class="pt-4 pb-2">
		<form on:submit|preventDefault={() => updateSearchQuery(document.getElementById('search-input').value)} class="flex items-center w-full max-w-xl mx-auto">
			<div class="relative w-full">
				<input type="search" id="search-input" bind:value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-l-3xl w-full z-20 text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search indexes..." />
			</div>
			<button type={searchQuery ? 'button' : 'submit'} on:click={searchQuery ? clearSearch : null} title={searchQuery ? 'Clear' : 'Search'} class="py-4 px-5 rounded-r-3xl items-center border {window.theme('border')} {window.theme('bgSecondaryLight')}">
				{#if searchQuery}
					<Cross size={5} />
				{:else}
					<Search2 size={5} />
				{/if}
			</button>
		</form>

		<!-- Alphabet Selector -->
		<!-- <div class="flex flex-wrap gap-2 justify-center mb-4 px-2">
			{#each alphabet as letter}
				<button on:click={() => selectLetter(letter)} class="min-w-[2.5rem] h-10 px-3 rounded-md text-sm font-medium transition-colors">
					{letter}
				</button>
			{/each}
		</div> -->

		<!-- Results Count -->
		{#if filteredIndexes.length > 0}
			<div class="flex flex-col text-center text-xs space-y-2 max-w-2xl mx-auto mt-4">
				Showing {filteredIndexes.length}
				{filteredIndexes.length !== 1 ? 'results' : 'result'}
				{#if searchQuery}
					matching "{searchQuery}"
				{:else if selectedLetter}
					starting with "{selectedLetter}"
				{/if}
			</div>
		{/if}
	</div>

	<!-- Loading Message -->
	{#if isSearching}
		<div class="flex justify-center py-8">
			<Spinner />
		</div>
	{/if}

	<!-- Indexes Display -->
	{#if !isSearching}
		{#if filteredIndexes.length > 0}
			{#each alphabet as letter}
				{#if groupedIndexes[letter] && groupedIndexes[letter].length > 0}
					<div class="py-6 border-b {window.theme('border')}">
						<h2 class="text-xl font-bold mb-4 {window.theme('textSecondary')}">
							{letter}
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
							{#each groupedIndexes[letter] as [index, verses]}
								<a href={`verses?keys=${verses.join(',')}`} class="block py-2 rounded-md hover:underline" target="_blank" rel="noopener">
									{index}
									<span class={window.theme('textSecondary')}>({verses.length})</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		{:else}
			<div class="flex flex-col text-center text-xs space-y-2 max-w-2xl mx-auto mt-4">
				No results found
				{#if searchQuery}
					matching "{searchQuery}"
				{:else if selectedLetter}
					starting with "{selectedLetter}"
				{/if}
			</div>
		{/if}
	{/if}
</div>
