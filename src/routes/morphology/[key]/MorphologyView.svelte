<script>
	export let data;

	import Spinner from '$svgs/Spinner.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import Table from './Table.svelte';
	import ErrorLoadingDataFromAPI from '$misc/ErrorLoadingDataFromAPI.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { staticEndpoint } from '$data/websiteSettings';
	import { __currentPage, __fontType, __wordTranslation, __verseTranslations, __wordTransliteration, __morphologyKey, __lexiconModalVisible, __wordRoot } from '$utils/stores';
	import { buttonClasses, buttonOutlineClasses } from '$data/commonClasses';
	import { fetchChapterData } from '$utils/fetchData';
	import { term } from '$utils/terminologies';
	import { wordAudioController } from '$utils/audioController';

	let chapter, verse, word;
	let wordRoot = '';
	let combinedDataPromise;

	// Split the key to get chapter, verse, and word numbers
	$: {
		const keySplit = data.key.split(':');
		chapter = +keySplit[0];
		verse = +keySplit[1];
		word = keySplit.length === 2 ? 1 : +keySplit[2];
		if (isNaN(word)) word = 1;
		__morphologyKey.set(`${chapter}:${verse}:${word}`);
	}

	$: fetchData = fetchChapterData({
		chapter,
		skipSave: true,
		reRenderWhenTheseUpdates: [$__fontType, $__wordTranslation, $__wordTransliteration]
	}).then((data) => data[`${chapter}:${verse}`]);

	$: combinedDataPromise = (async () => {
		try {
			// Fetch all necessary morphology-related resources in parallel
			const [wordSummaryRes, wordVerbsRes, keyMapRes, exactMapRes] = await Promise.all([
				// 1. Word summaries per chapter
				fetch(`${staticEndpoint}/lexicon/word-summaries/${chapter}.json?version=1`),

				// 2. Word-to-verbs mapping (perfect, imperfect, etc.)
				fetch(`${staticEndpoint}/morphology-data/word-verbs.json?version=1`),

				// 3. Mapping of word keys to [arabic, transliteration, translation, root]
				fetch(`${staticEndpoint}/morphology-data/word-keys-map.json?v=1`),

				// 4. Uthmani to all keys mapping for finding exact matches
				fetch(`${staticEndpoint}/morphology-data/exact-words-in-quran.json`)
			]);

			// Parse all JSON responses in parallel
			const [wordSummary, wordVerbs, keyMap, exactMap] = await Promise.all([wordSummaryRes.json(), wordVerbsRes.json(), keyMapRes.json(), exactMapRes.json()]);

			// Prepare helper mappings
			const keyToMeta = keyMap?.data || {};
			const uthmaniToKeys = exactMap?.data || {};

			// Get current word's metadata
			const keyMeta = keyToMeta[$__morphologyKey];
			const uthmani = Array.isArray(keyMeta) ? keyMeta[0] : null;
			wordRoot = Array.isArray(keyMeta) ? keyMeta[3] : '';

			// Prepare exact matches list
			let exactMatches = [];
			if (uthmani) {
				exactMatches = (uthmaniToKeys[uthmani] || []).map((key) => {
					const meta = keyToMeta[key] || [];
					return {
						key,
						arabic: meta[0] || '',
						transliteration: meta[1] || '',
						translation: meta[2] || ''
					};
				});
			}

			// Prepare same root word list
			let sameRootWords = [];
			if (wordRoot) {
				try {
					const sameRootRes = await fetch(`${staticEndpoint}/morphology-data/words-with-same-root/${wordRoot}.json`);
					sameRootWords = (await sameRootRes.json())?.data || [];
				} catch (e) {
					console.error('Failed to load root words:', e);
				}
			}

			// Final combined result
			return {
				wordSummary,
				wordVerbs,
				exactMatches,
				sameRootWords
			};
		} catch (err) {
			console.error('Failed to load combined morphology data:', err);
			return null;
		}
	})();
</script>

<div class="space-y-6 my-8">
	<!-- Verse navigator -->
	{#if $__currentPage === 'morphology'}
		<div id="verse-navigator" class="flex flex-row justify-center space-x-8 text-sm">
			{#if verse === 1 && chapter > 1}
				<a href="/morphology/{+chapter - 1}:1" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('chapter')} {+chapter - 1}</a>
			{/if}
			{#if verse > 1}
				<a href="/morphology/{chapter}:{+verse - 1}" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('verse')} {chapter}:{+verse - 1}</a>
			{/if}
			{#if verse < quranMetaData[chapter].verses}
				<a href="/morphology/{chapter}:{+verse + 1}" class={buttonOutlineClasses}>{term('verse')} {chapter}:{+verse + 1} {@html '&#x2192;'}</a>
			{/if}
			{#if verse === quranMetaData[chapter].verses && chapter < 114}
				<a href="/morphology/{+chapter + 1}:1" class={buttonOutlineClasses}>{term('chapter')} {+chapter + 1} {@html '&#x2192;'}</a>
			{/if}
		</div>
	{/if}

	<!-- Verse text -->
	<div id="verse">
		{#await fetchData}
			<Spinner />
		{:then value}
			<div class="flex flex-wrap justify-center direction-rtl">
				<WordsBlock key={`${chapter}:${verse}`} {value} />
			</div>
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" />
		{/await}
	</div>

	<!-- Word details -->
	<div id="word-details" class="flex flex-col">
		{#await combinedDataPromise}
			<Spinner />
		{:then result}
			<!-- Word summary -->
			<div id="word-summary" class="text-center mx-auto md:w-3/4 text-sm md:text-lg pb-6 border-b-2 {window.theme('border')}">
				<div class="flex flex-col space-y-4">
					<span>{@html result.wordSummary?.[$__morphologyKey]}</span>
				</div>
				<div class="pt-4 flex flex-row justify-center space-x-2 text-xs">
					<button class={buttonClasses} on:click={() => wordAudioController({ key: data.key, chapter, verse })}>Play Word</button>
					{#if $__currentPage === 'morphology'}
						<a href="/{chapter}/{verse}" class={buttonClasses}>Goto Verse</a>
					{/if}
				</div>
			</div>

			<!-- Verbs -->
			{#if result.wordVerbs?.data?.hasOwnProperty($__morphologyKey)}
				<div id="word-forms" class="pb-8 pt-2 border-b-2 {window.theme('border')}">
					<div class="flex flex-col">
						<div class="mx-auto text-center">
							<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-6">
								{#each Object.entries(result.wordVerbs.data[$__morphologyKey]) as [key, value]}
									{#if value !== null}
										<div class="flex flex-col py-5 duration-300 transform {window.theme('bgMain')} border {window.theme('border')} rounded-3xl shadow-sm text-center hover:-translate-y-2">
											<div class="flex items-center justify-center mb-2">
												<p id="verb-1" class="text-xl md:text-2xl pb-4 leading-5 arabic-font-{$__fontType}">{value}</p>
											</div>
											<p class="text-xs capitalize opacity-70">{key.replace('_', ' ')}</p>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Words with same root -->
			{#if result.sameRootWords.length > 0}
				<div id="word-root-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
					<Table wordData={result.sameRootWords} tableType={1} />
				</div>
			{:else}
				<p class="text-center py-6 opacity-60">No other words found with same root.</p>
			{/if}

			<!-- Exact match words -->
			{#if result.exactMatches.length > 0}
				<div id="exact-word-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
					<Table wordData={result.exactMatches} tableType={2} />
				</div>
			{:else}
				<p class="text-center py-6 opacity-60">No matching words found in Quran.</p>
			{/if}
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" />
		{/await}
	</div>
</div>
