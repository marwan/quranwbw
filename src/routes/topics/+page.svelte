<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ArrowUp from '$svgs/ArrowUp.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';
	import { staticEndpoint } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { page } from '$app/stores';

	let allTopics = [];
	let showScrollTop = false;
	let selectedTopicId = null;
	let selectedTopicKeys = '';
	let selectedTopicName = '';
	let isLoading = true;

	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	let groupedTopics = {};

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

	// Watch for URL parameter changes
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

	function handleScroll() {
		showScrollTop = window.scrollY > 150;
	}

	onMount(async () => {
		const rawTopics = await fetchAndCacheJson(`${staticEndpoint}/others/quran-topics.json?version=1`, 'other');

		// Convert to array with IDs
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
			<div class="my-4 text-center text-xs">
				<span>Showing {resultsCount} {resultsCount > 1 ? 'results' : 'result'} for the topic "{selectedTopicName}".</span>
				<!-- <span> Click here to go back to the Topics page.</span> -->
			</div>

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
				{#if groupedTopics[letter] && groupedTopics[letter].length > 0}
					<div id={letter} class="py-6 border-b {window.theme('border')} scroll-mt-4">
						<h2 class="text-xl font-bold mb-4 {window.theme('textSecondary')}">
							{letter}
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
							{#each groupedTopics[letter] as item}
								<a href="?id={item.id}" class="block py-2 rounded-md hover:underline text-left" rel="noopener">
									{item.topic}
									<span class={window.theme('textSecondary')}>({item.verses.length})</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
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
