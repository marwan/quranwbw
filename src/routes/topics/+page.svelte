<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ArrowUp from '$svgs/ArrowUp.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { page } from '$app/stores';

	// State variables
	let allTopics = [];
	let showScrollTop = false;
	let selectedTopicId = null;
	let selectedTopicKeys = '';
	let selectedTopicName = '';
	let isLoading = true;

	// Generate A-Z alphabet array
	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	let groupedTopics = {};

	// Group topics by first letter
	$: {
		groupedTopics = {};
		for (const item of allTopics) {
			const topic = item.topic;
			const firstLetter = topic[0].toUpperCase();
			if (!groupedTopics[firstLetter]) {
				groupedTopics[firstLetter] = [];
			}
			groupedTopics[firstLetter].push(item);
		}
	}

	// Handle URL parameter changes for topic selection
	$: if ($page) {
		const urlParams = new URLSearchParams($page.url.search);
		const topicId = urlParams.get('id');
		if (topicId) {
			selectedTopicId = parseInt(topicId);
			// Find the topic by ID
			const topic = allTopics.find((item) => item.id === selectedTopicId);
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

	// Show/hide scroll to top button based on scroll position
	function handleScroll() {
		showScrollTop = window.scrollY > 70;
	}

	onMount(async () => {
		// Fetch and parse topics data
		const rawTopics = await fetchAndCacheJson(cdnStaticDataUrls.quranTopics, 'other');

		// Convert to array with IDs (1-based indexing)
		allTopics = Object.entries(rawTopics).map(([topic, verses], index) => ({
			id: index + 1,
			topic: topic,
			verses: verses
		}));

		isLoading = false;

		// Add scroll listener
		window.addEventListener('scroll', handleScroll);

		// Cleanup
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	__currentPage.set('topics');
</script>

<PageHead title="Topics" />

<div class="mx-auto max-w-6xl">
	{#if isLoading}
		<Spinner />
	{:else if selectedTopicId && selectedTopicKeys}
		{@const resultsCount = selectedTopicKeys.split(',').length}
		<!-- Verses Display -->
		<div>
			<div class="my-4 text-center text-xs">Showing {resultsCount} {resultsCount > 1 ? 'results' : 'result'} for the topic "{selectedTopicName}".</div>
			<FullVersesDisplay keys={selectedTopicKeys} />
		</div>
	{:else}
		<!-- Alphabet Selector -->
		<div class="my-4">
			<div class="mx-auto flex flex-wrap justify-center px-2">
				{#each alphabet as letter}
					<a href="#{letter}" class="ml-1 mt-1 px-2 py-1 rounded-full cursor-pointer no-underline min-w-[2rem] text-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}">
						{letter}
					</a>
				{/each}
			</div>
		</div>

		<!-- Topics Display -->
		{#if allTopics.length > 0}
			{#each alphabet as letter}
				<div id={letter} class="py-6 border-b {window.theme('border')} scroll-mt-4">
					<h2 class="text-xl font-bold mb-4 {window.theme('textSecondary')}">
						{letter}
					</h2>
					{#if groupedTopics[letter] && groupedTopics[letter].length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
							{#each groupedTopics[letter] as item}
								<a href="?id={item.id}" class="block py-2 rounded-md hover:underline text-left" rel="noopener">
									{item.topic}
									<span class={window.theme('textSecondary')}>({item.verses.length})</span>
								</a>
							{/each}
						</div>
					{:else}
						<p>No topics available for this letter.</p>
					{/if}
				</div>
			{/each}
		{/if}
	{/if}
</div>

<!-- Scroll to Top Button -->
{#if showScrollTop && !selectedTopicId}
	<button on:click={() => window.scrollTo({ top: 0, behavior: 'auto' })} class="z-20 fixed bottom-6 right-6 p-3 rounded-full transition-opacity duration-300 {window.theme('bgMain')} {window.theme('border')} border" title="Scroll to top" aria-label="Scroll to top">
		<ArrowUp size={5} />
	</button>
{/if}
