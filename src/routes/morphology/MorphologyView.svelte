<script>
	export let data;

	import Spinner from '$svgs/Spinner.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import Table from './Table.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { morphologyDataUrls } from '$data/websiteSettings';
	import { __currentPage, __fontType, __morphologyKey, __wordTranslation, __wordTransliteration } from '$utils/stores';
	import { buttonClasses, buttonOutlineClasses } from '$data/commonClasses';
	import { fetchChapterData, fetchAndCacheJson, fetchWordData } from '$utils/fetchData';
	import { term } from '$utils/terminologies';
	import { wordAudioController } from '$utils/audioController';
	import { fade } from 'svelte/transition';

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

	// Fetch all data in parallel
	$: allDataPromise = (async () => {
		// Fetch verse data
		const chapterDataPromise = fetchChapterData({
			chapter,
			fontType: $__fontType,
			wordTranslation: $__wordTranslation,
			wordTransliteration: $__wordTransliteration,
			preventStoreUpdate: true
		}).then((data) => data[`${chapter}:${verse}`]);

		// Fetch word summary data
		const wordSummaryDataPromise = fetchAndCacheJson(morphologyDataUrls.getWordSummary(chapter), 'morphology').catch(() => ({}));

		// Fetch word verbs data
		const wordVerbsDataPromise = fetchAndCacheJson(morphologyDataUrls.wordVerbs, 'morphology').catch(() => ({}));

		// Fetch words with same root
		const wordsWithSameRootDataPromise = fetchAndCacheJson(morphologyDataUrls.wordsWithSameRootKeys, 'morphology').catch(() => ({}));

		// Fetch exact words in Quran
		const exactWordsInQuranDataPromise = (async () => {
			try {
				const [keyMap, exactMap] = await Promise.all([
					// Uthmani text and root data
					fetchAndCacheJson(morphologyDataUrls.wordUthmaniAndRoots, 'morphology'),
					// Exact words keys
					fetchAndCacheJson(morphologyDataUrls.exactWordsKeys, 'morphology')
				]);

				const keyToMeta = keyMap?.data || {};
				const uthmaniToKeys = exactMap?.data || {};
				const keyMeta = keyToMeta[$__morphologyKey];

				let uthmani = Array.isArray(keyMeta) ? keyMeta[0] : null;
				wordRoot = Array.isArray(keyMeta) ? keyMeta[1] : '';

				// Remove trailing pause mark (e.g., ۖ, ۗ, etc.) from uthmani using defined symbols
				const unwantedSymbolsArray = ['ۖ', 'ۗ', 'ۘ', 'ۙ', 'ۚ', 'ۛ', 'ۜ', '۩', '۞'];
				const unwantedRegex = new RegExp(`[${unwantedSymbolsArray.join('')}]`, 'g');

				if (uthmani) {
					uthmani = uthmani.replace(unwantedRegex, '');
				}

				if (!uthmani) return [];

				// Return the matching word keys from the 'exact-words-keys' file if available.
				// Since the 'exact-words-keys' file excludes unique words, if this word is not found, it means it's unique — so return the original word key.
				return uthmaniToKeys[uthmani] || [$__morphologyKey];
			} catch (error) {
				console.warn('Failed to load exact words in Quran:', error);
				return [];
			}
		})();

		// Fetch arabic, translation and transliteration word data
		const wordDataPromise = await fetchWordData(1, $__wordTranslation, $__wordTransliteration).catch(() => ({}));

		// Wait for all promises to resolve
		const [chapterData, wordVerbsData, wordSummaryData, wordsWithSameRootData, exactWordsInQuranData, wordData] = await Promise.all([chapterDataPromise, wordVerbsDataPromise, wordSummaryDataPromise, wordsWithSameRootDataPromise, exactWordsInQuranDataPromise, wordDataPromise]);

		return {
			chapterData,
			wordVerbsData,
			wordSummaryData,
			wordsWithSameRootData,
			exactWordsInQuranData,
			wordData
		};
	})();
</script>

{#await allDataPromise}
	<Spinner />
{:then allData}
	<div class="space-y-6 my-8" in:fade={{ duration: 300 }}>
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
			{#if allData.chapterData}
				<div class="flex flex-wrap justify-center direction-rtl">
					<WordsBlock key={`${chapter}:${verse}`} value={allData.chapterData} />
				</div>
			{:else}
				<ErrorLoadingData center="false" error="Failed to load verse data" />
			{/if}
		</div>

		{#if allData.wordSummaryData && Object.keys(allData.wordSummaryData).length > 0}
			<div id="word-summary" class="text-center mx-auto md:w-3/4 text-sm md:text-lg pb-6 border-b-2 {window.theme('border')}">
				<div class="flex flex-col space-y-4">
					<span>{@html allData.wordSummaryData.data[$__morphologyKey]}</span>
					<!-- <button class="text-lg font-bold underline" on:click={() => showLexiconModal()}>View Lanes Lexicon Data &rarr;</button> -->
				</div>

				<!-- Buttons -->
				<div class="pt-4 flex flex-row justify-center space-x-2 text-xs">
					<button
						class={buttonClasses}
						on:click={() =>
							wordAudioController({
								key: allData.wordSummaryData.key,
								chapter: chapter,
								verse: verse
							})}>Play Word</button
					>

					<!-- Show the "goto verse" button if the user in on morphology page -->
					{#if $__currentPage === 'morphology'}
						<a href="/{chapter}/{verse}" class={buttonClasses}>Goto Verse</a>
					{/if}
				</div>
			</div>
		{/if}

		<div id="word-details" class="flex flex-col">
			<!-- Verbs data -->
			{#if allData?.wordVerbsData?.data && $__morphologyKey in allData.wordVerbsData.data}
				<div id="word-forms" class="pb-8 pt-2 border-b-2 {window.theme('border')}">
					<div class="flex flex-col">
						<div id="different-verbs">
							<div class="mx-auto text-center">
								<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-6">
									{#each Object.entries(allData.wordVerbsData.data[$__morphologyKey]) as [key, value]}
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

			<!-- Word with same root -->
			{#if allData?.wordsWithSameRootData?.data && wordRoot && wordRoot in allData.wordsWithSameRootData.data}
				<div id="words-with-same-root" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
					<Table wordKeys={allData.wordsWithSameRootData.data[wordRoot]} tableType={1} wordData={allData.wordData} />
				</div>
			{/if}

			<!-- Exact words in Quran -->
			{#if Array.isArray(allData?.exactWordsInQuranData) && allData.exactWordsInQuranData.length}
				<div id="exact-word-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
					<Table wordKeys={allData.exactWordsInQuranData} tableType={2} wordData={allData.wordData} />
				</div>
			{/if}
		</div>
	</div>
{:catch error}
	<ErrorLoadingData {error} />
{/await}
