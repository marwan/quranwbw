<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { debounce } from '$utils/debounce';

	let topics = {};
	let allTopics = [];
	let filteredTopics = [];
	let selectedLetter = 'A';
	let searchQuery = '';
	let debouncedSearch = '';
	let isSearching = false;

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
	__currentPage.set('topics');

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
		const res = await fetch('https://static.quranwbw.com/data/v4/others/quran-topics.json');
		topics = await res.json();
		allTopics = Object.entries(topics);
	});
</script>

<PageHead title="Topics" />

<div class="container mx-auto px-4 py-6">
	<!-- Search Input -->
	<div class="mb-4">
		<input type="text" placeholder="Search topics..." bind:value={searchQuery} class="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300" />
	</div>

	<!-- Alphabet Filter (disabled when searching) -->
	{#if !searchQuery.trim()}
		<div class="flex flex-wrap gap-2 mb-6">
			{#each alphabet as letter}
				<a
					href={`?letter=${letter}`}
					class="px-3 py-1 border rounded cursor-pointer hover:bg-gray-100 transition
						{letter === selectedLetter ? 'bg-blue-500 text-white font-semibold' : ''}"
				>
					{letter}
				</a>
			{/each}
		</div>
	{/if}

	<!-- Loading Message -->
	{#if isSearching}
		<p class="text-gray-500 italic mb-4">Searching...</p>
	{/if}

	<!-- Topic List -->
	{#if filteredTopics.length === 0 && !isSearching}
		<p class="text-gray-500">No topics found.</p>
	{:else if !isSearching}
		<div class="space-y-6">
			{#each filteredTopics as [topic, verses]}
				<div class="border-b pb-4">
					<h2 class="text-xl font-semibold">{topic}</h2>
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
