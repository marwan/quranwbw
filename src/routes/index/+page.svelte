<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import Cross from '$svgs/Cross.svelte';
	import ArrowUp from '$svgs/ArrowUp.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';
	import { debounce } from '$utils/debounce';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	// import { buttonClasses } from '$data/commonClasses';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let allIndexes = [];
	let filteredIndexes = [];
	let searchQuery = '';
	let debouncedSearch = '';
	let isSearching = false;
	let showScrollTop = false;
	let selectedTopicId = null;
	let selectedTopicKeys = '';
	let selectedTopicName = '';

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	let groupedIndexes = {};

	$: console.log(selectedTopicName);

	$: {
		groupedIndexes = {};
		for (const item of filteredIndexes) {
			const index = item.topic;
			const firstLetter = index[0].toUpperCase();
			if (!groupedIndexes[firstLetter]) {
				groupedIndexes[firstLetter] = [];
			}
			groupedIndexes[firstLetter].push(item);
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

	// Filter indexes on debouncedSearch
	$: filteredIndexes = allIndexes
		.filter((item) => {
			const matchesSearch = debouncedSearch ? item.topic.toLowerCase().includes(debouncedSearch) : true;
			return matchesSearch;
		})
		.sort((a, b) => a.topic.localeCompare(b.topic));

	// Watch for URL parameter changes
	$: if ($page) {
		const urlParams = new URLSearchParams($page.url.search);
		const topicId = urlParams.get('id');
		if (topicId) {
			selectedTopicId = parseInt(topicId);
			// Find the topic by ID
			const topic = allIndexes.find((item) => item.id === selectedTopicId);
			if (topic) {
				selectedTopicKeys = topic.verses.join(',');
				selectedTopicName = topic.topic;
			}
		} else {
			selectedTopicId = null;
			selectedTopicKeys = '';
			selectedTopicName = '';
		}
	}

	function clearSearch() {
		searchQuery = '';
	}

	function handleTopicClick(topicId) {
		goto(`?id=${topicId}`, { keepFocus: true, noScroll: false });
	}

	// function closeVerses() {
	// 	goto('/index', { keepFocus: true });
	// }

	function handleScroll() {
		showScrollTop = window.scrollY > 150;
	}

	onMount(async () => {
		const rawIndexes = await fetchAndCacheJson(`${staticEndpoint}/others/quran-topics.json?version=1`, 'other');

		// Convert to array with IDs
		allIndexes = Object.entries(rawIndexes).map(([topic, verses], index) => ({
			id: index + 1,
			topic: topic,
			verses: verses
		}));

		// Add scroll listener
		window.addEventListener('scroll', handleScroll);

		// Cleanup
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	__currentPage.set('index');
</script>

<PageHead title="Index" />

<div class="mx-auto max-w-6xl">
	{#if selectedTopicId && selectedTopicKeys}
		<!-- Verses Display -->
		<div class="">
			<!-- <p class="text-lg mb-2 {window.theme('textSecondary')}">
				Showing verses for <span class="font-semibold">{selectedTopicName}</span>
			</p>
			<button class="text-sm {buttonClasses}" on:click={closeVerses}>Back to Topics</button> -->
			<FullVersesDisplay keys={selectedTopicKeys} />
		</div>
	{:else}
		<!-- Search Input -->
		<div class="pt-4 pb-2">
			<form on:submit|preventDefault class="flex items-center w-full max-w-xl mx-auto">
				<div class="relative w-full">
					<input type="search" id="search-input" bind:value={searchQuery} class="bg-transparent block py-4 pl-4 rounded-l-3xl w-full z-20 text-sm border {window.theme('placeholder')} {window.theme('border')} {window.theme('input')}" placeholder="Search indexes..." />
				</div>
				<button type="button" on:click={clearSearch} title={searchQuery ? 'Clear' : 'Search'} class="py-4 px-5 rounded-r-3xl items-center border {window.theme('border')} {window.theme('bgSecondaryLight')}">
					{#if searchQuery}
						<Cross size={5} />
					{:else}
						<Search2 size={5} />
					{/if}
				</button>
			</form>

			<!-- Alphabet Selector -->
			<div class="max-w-lg mx-auto flex flex-wrap gap-2 justify-center my-4 px-2 text-sm">
				{#each alphabet as letter}
					<a href="#{letter}" class="ml-1 mt-1 px-2 py-1 rounded-full cursor-pointer no-underline min-w-[2rem] text-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}">
						{letter}
					</a>
				{/each}
			</div>
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
						<div id={letter} class="py-6 border-b {window.theme('border')} scroll-mt-4">
							<h2 class="text-xl font-bold mb-4 {window.theme('textSecondary')}">
								{letter}
							</h2>
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
								{#each groupedIndexes[letter] as item}
									<button on:click={() => handleTopicClick(item.id)} class="block py-2 rounded-md hover:underline text-left" rel="noopener">
										{item.topic}
										<span class={window.theme('textSecondary')}>({item.verses.length})</span>
									</button>
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
					{/if}
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- Scroll to Top Button -->
{#if showScrollTop}
	<button on:click={() => window.scrollTo({ top: 0, behavior: 'auto' })} class="z-20 fixed bottom-6 right-6 p-3 rounded-full transition-opacity duration-300 {window.theme('bgMain')} {window.theme('border')} border" title="Scroll to top" aria-label="Scroll to top">
		<ArrowUp size={5} />
	</button>
{/if}
