<script>
	export let data;

	import Spinner from '$svgs/Spinner.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import Table from './Table.svelte';
	import ErrorLoadingDataFromAPI from '$misc/ErrorLoadingDataFromAPI.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { staticEndpoint } from '$data/websiteSettings';
	import { __currentPage, __fontType, __morphologyKey, __wordTranslation, __wordTransliteration } from '$utils/stores';
	import { buttonClasses, buttonOutlineClasses } from '$data/commonClasses';
	import { fetchChapterData, fetchAndCacheJson } from '$utils/fetchData';
	import { term } from '$utils/terminologies';
	import { wordAudioController } from '$utils/audioController';

	let wordSummaryData, wordVerbsData, exactWordsInQuranData, wordsWithSameRootData;
	let chapter, verse, word;
	let wordRoot = '';

	// Extract chapter, verse, and word from the key, defaulting word to 1 if missing or invalid
	$: {
		const [chapterStr, verseStr, wordStr] = data.key.split(':');
		chapter = +chapterStr;
		verse = +verseStr;
		word = +wordStr || 1;
		__morphologyKey.set(`${chapter}:${verse}:${word}`);
	}

	// Fetch verse data based on chapter and verse
	$: chapterData = (async () => {
		const data = await fetchChapterData({
			chapter,
			fontType: $__fontType,
			wordTranslation: $__wordTranslation,
			wordTransliteration: $__wordTransliteration,
			preventStoreUpdate: true
		});
		return data[`${chapter}:${verse}`];
	})();

	// Fetch words data for morphology
	$: {
		// Fetch word verbs data
		wordVerbsData = (async () => {
			try {
				return await fetchAndCacheJson(`${staticEndpoint}/morphology-data/word-verbs.json?version=1`, 'morphology');
			} catch {
				return {};
			}
		})();

		// Fetch word summary data
		wordSummaryData = (async () => {
			try {
				return await fetchAndCacheJson(`${staticEndpoint}/lexicon/word-summaries/${chapter}.json?version=2`, 'morphology');
			} catch {
				return {};
			}
		})();

		// Fetch words with same root
		wordsWithSameRootData = (async () => {
			try {
				return await fetchAndCacheJson(`${staticEndpoint}/morphology-data/words-with-same-root-keys.json?version=2`, 'morphology');
			} catch {
				return {};
			}
		})();

		// Fetch exact words in Quran
		exactWordsInQuranData = (async () => {
			try {
				const [keyMap, exactMap] = await Promise.all([
					// To get the root of a word
					fetchAndCacheJson(`${staticEndpoint}/morphology-data/word-keys-map.json?version=1`, 'morphology'),

					// To show the exact words in Quran
					fetchAndCacheJson(`${staticEndpoint}/morphology-data/exact-words-in-quran.json?version=2`, 'morphology')
				]);

				const keyToMeta = keyMap?.data || {};
				const uthmaniToKeys = exactMap?.data || {};
				const keyMeta = keyToMeta[$__morphologyKey];

				let uthmani = Array.isArray(keyMeta) ? keyMeta[0] : null;
				wordRoot = Array.isArray(keyMeta) ? keyMeta[3] : '';

				// Remove trailing pause mark (e.g., ۛ, ۚ, etc.) from uthmani
				const pauseMarkRegex = /[\u06D6-\u06DC\u06D7\u06D8\u06D9\u06DA\u06DB\u06E9]$/u;
				if (uthmani) {
					uthmani = uthmani.replace(pauseMarkRegex, '');
				}

				if (!uthmani) return [];

				return uthmaniToKeys[uthmani] || [];
			} catch (error) {
				console.warn('Failed to load exact words in Quran:', error);
				return [];
			}
		})();
	}
</script>

<div class="space-y-6 my-8">
	{#if $__currentPage === 'morphology'}
		<div id="verse-navigator" class="flex flex-row justify-center space-x-8 text-sm">
			<!-- previous chapter -->
			{#if verse === 1 && chapter > 1}
				<a href="/morphology?word={+chapter - 1}:1" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('chapter')} {+chapter - 1}</a>
			{/if}

			<!-- next verse -->
			{#if verse > 1}
				<a href="/morphology?word={chapter}:{+verse - 1}" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('verse')} {chapter}:{+verse - 1}</a>
			{/if}

			<!-- previous verse -->
			{#if verse < quranMetaData[chapter].verses}
				<a href="/morphology?word={chapter}:{+verse + 1}" class={buttonOutlineClasses}>{term('verse')} {chapter}:{+verse + 1} {@html '&#x2192;'}</a>
			{/if}

			<!-- next chapter -->
			{#if verse === quranMetaData[chapter].verses && chapter < 114}
				<a href="/morphology?word={+chapter + 1}:1" class={buttonOutlineClasses}>{term('chapter')} {+chapter + 1} {@html '&#x2192;'}</a>
			{/if}
		</div>
	{/if}

	<div id="verse">
		{#await chapterData}
			<Spinner />
		{:then data}
			<div class="flex flex-wrap justify-center direction-rtl">
				<WordsBlock key={`${chapter}:${verse}`} value={data} />
			</div>
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" {error} />
		{/await}
	</div>

	<div id="word-summary" class="text-center mx-auto md:w-3/4 text-sm md:text-lg pb-6 border-b-2 {window.theme('border')}">
		{#await wordSummaryData then data}
			<div class="flex flex-col space-y-4">
				<span>{@html data.data[$__morphologyKey]}</span>
				<!-- <button class="text-lg font-bold underline" on:click={() => showLexiconModal()}>View Lanes Lexicon Data &rarr;</button> -->
			</div>

			<!-- Buttons -->
			<div class="pt-4 flex flex-row justify-center space-x-2 text-xs">
				<button
					class={buttonClasses}
					on:click={() =>
						wordAudioController({
							key: data.key,
							chapter: chapter,
							verse: verse
						})}>Play Word</button
				>

				<!-- Show the "goto verse" button if the user in on morphology page -->
				{#if $__currentPage === 'morphology'}
					<a href="/{chapter}/{verse}" class={buttonClasses}>Goto Verse</a>
				{/if}
			</div>
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" {error} />
		{/await}
	</div>

	<div id="word-details" class="flex flex-col">
		<!-- Verbs data -->
		{#await wordVerbsData}
			<Spinner />
		{:then data}
			{#if Object.prototype.hasOwnProperty.call(data?.data, $__morphologyKey)}
				<div id="word-forms" class="pb-8 pt-2 border-b-2 {window.theme('border')}">
					<div class="flex flex-col">
						<div id="different-verbs">
							<div class="mx-auto text-center">
								<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-6">
									{#each Object.entries(data.data[$__morphologyKey]) as [key, value]}
										{#if value !== null}
											<div class="flex flex-col py-5 duration-300 transform {window.theme('bgMain')} border {window.theme('border')} rounded-3xl shadow-sm text-center hover:-translate-y-2">
												<div class="flex items-center justify-center mb-2">
													<p id="verb-1" class="text-xl md:text-2xl pb-4 leading-5 arabic-font-1">{value}</p>
												</div>
												<p class="text-xs capitalize opacity-70">{key.replace('_', ' ')}</p>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" {error} />
		{/await}

		<!-- Word with same root -->
		{#key wordRoot}
			{#await wordsWithSameRootData}
				<Spinner />
			{:then data}
				{#if wordRoot in data.data}
					<div id="words-with-same-root" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
						<Table wordKeys={data.data[wordRoot]} tableType={1} />
					</div>
				{/if}
			{:catch error}
				<ErrorLoadingDataFromAPI center="false" {error} />
			{/await}
		{/key}

		<!-- Exact words in Quran -->
		{#await exactWordsInQuranData}
			<Spinner />
		{:then data}
			{#if Array.isArray(data) && data.length}
				<div id="exact-word-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
					<Table wordKeys={data} tableType={2} />
				</div>
			{/if}
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" {error} />
		{/await}
	</div>
</div>
