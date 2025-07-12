<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { debounce } from '$utils/debounce';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';

	let topics = {};
	let allTopics = [];
	let filteredTopics = [];
	let selectedLetter = 'A';
	let searchQuery = '';
	let debouncedSearch = '';
	let isSearching = false;

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	// Update selectedLetter from URL
	$: selectedLetter = $page.url.searchParams.get('letter')?.toUpperCase() || 'A';

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
			return topic.toUpperCase().startsWith(selectedLetter);
		})
		.sort((a, b) => a[0].localeCompare(b[0]));

	onMount(async () => {
		topics = await fetchAndCacheJson(`${staticEndpoint}/others/quran-topics.json?version=1`, 'other');
		allTopics = Object.entries(topics);
	});

	__currentPage.set('topics');
</script>

<PageHead title="Topics" />

<div class="container mx-auto px-4 py-4">
	<!-- Search Input -->
	<div class="relative flex max-w-xl mx-auto mb-4">
		<input type="search" id="search-input" bind:value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-3xl w-full z-20 text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search topics..." required />
	</div>

	<!-- Alphabet Filter (disabled when searching) -->
	{#if !searchQuery.trim()}
		<div class="flex flex-wrap gap-1 mb-6 items-center justify-center text-lg">
			{#each alphabet as letter, i}
				<a
					href={`?letter=${letter}`}
					class="px-1 py-1 cursor-pointer transition
					{letter === selectedLetter ? `font-bold underline ${window.theme('textSecondary')}` : ''}"
				>
					{letter}
				</a>
				{#if i < alphabet.length - 1}
					<span class="text-gray-400 select-none">•</span>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Loading Message -->
	{#if isSearching}
		<p class="text-gray-500 italic mb-4">Loading...</p>
	{/if}

	<!-- Topic List -->
	{#if filteredTopics.length === 0 && !isSearching}
		<p class="text-gray-500">No topics found.</p>
	{:else if !isSearching}
		<div class="space-y-6">
			{#each filteredTopics as [topic, verses]}
				<div class="pb-4 border-b {window.theme('border')}">
					<h2 class="text-xl font-semibold {window.theme('textSecondary')}">{topic}</h2>
					<p class="text-gray-700">
						{#each verses as verse, i}
							<a href={`https://quranwbw.com/${verse.replace(':', '/')}`} class="text-blue-600 hover:underline" target="_blank" rel="noopener">
								{verse}
							</a>{i < verses.length - 1 ? ', ' : ''}
						{/each}
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
