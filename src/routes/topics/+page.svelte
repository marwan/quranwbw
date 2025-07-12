<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let topics = {};
	let filteredTopics = [];
	let selectedLetter = 'A';
	let searchQuery = '';
	const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

	__currentPage.set('topics');

	// Sync URL param
	$: selectedLetter = $page.url.searchParams.get('letter')?.toUpperCase() || 'A';

	// Filter topics
	$: filteredTopics = Object.entries(topics)
		.filter(([topic]) => {
			if (searchQuery.trim()) {
				return topic.toLowerCase().includes(searchQuery.trim().toLowerCase());
			}
			return topic.toUpperCase().startsWith(selectedLetter);
		})
		.sort((a, b) => a[0].localeCompare(b[0]));

	onMount(async () => {
		const res = await fetch('https://static.quranwbw.com/data/v4/others/quran-topics.json');
		topics = await res.json();
	});
</script>

<PageHead title="Topics" />

<div class="container mx-auto px-4 py-6">
	<!-- <h1 class="text-3xl font-bold mb-4">Quran Topics</h1> -->

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

	<!-- Topic List -->
	{#if filteredTopics.length === 0}
		<p class="text-gray-500">No topics found.</p>
	{:else}
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
