<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';
	import { debounce } from '$utils/debounce';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';

	let topics = {};
	let allTopics = [];
	let filteredTopics = [];
	let searchQuery = '';
	let debouncedSearch = '';
	let isSearching = false;

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	let groupedTopics = {};

	$: {
		groupedTopics = {};
		for (const [topic, verses] of filteredTopics) {
			const firstLetter = topic[0].toUpperCase();
			if (!groupedTopics[firstLetter]) {
				groupedTopics[firstLetter] = [];
			}
			groupedTopics[firstLetter].push([topic, verses]);
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

	// Filter topics on debouncedSearch or selectedLetter
	$: filteredTopics = allTopics
		.filter(([topic]) => {
			if (debouncedSearch) {
				return topic.toLowerCase().includes(debouncedSearch);
			}
			return true;
		})
		.sort((a, b) => a[0].localeCompare(b[0]));

	onMount(async () => {
		topics = await fetchAndCacheJson(`${staticEndpoint}/others/quran-topics.json?version=1`, 'other');
		allTopics = Object.entries(topics);
	});

	__currentPage.set('topics');
</script>

<PageHead title="Topics" />

<div class="mx-auto px-4">
	<!-- Search Input -->
	<!-- <div class="relative flex max-w-xl mx-auto mb-4">
		<input type="search" id="search-input" bind:value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-3xl w-full text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search topics..." required />
	</div> -->

	<!-- Search Count -->
	<!-- <div id="search-results-information" class="text-center text-xs">
		{#if filteredTopicsCount > 0}
			{#if searchQueryLength > 0}
				<span>Showing {filteredTopicsCount} results related to "{searchQuery}".</span>
			{:else}
				<span>Showing {filteredTopicsCount} results starting with the alphabet "{selectedLetter}".</span>
			{/if}
		{/if}
	</div> -->

	<!-- Loading Message -->
	{#if isSearching}
		<Spinner />
	{/if}

	<!-- Grouped Topics by Alphabet -->
	{#if !isSearching}
		{#each alphabet as letter}
			<div class="py-8 border-b {window.theme('border')}">
				<h2 class="text-2xl font-bold mb-2 {window.theme('textSecondary')}">{letter}</h2>
				{#if groupedTopics[letter] && groupedTopics[letter].length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4">
						{#each groupedTopics[letter] as [topic, verses]}
							<a href={`verses?keys=${verses.join(',')}`} class="hover:underline" target="_blank" rel="noopener">
								{topic} ({verses.length})
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500 italic">No topics under this letter.</p>
				{/if}
			</div>
		{/each}
	{/if}
</div>
