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

	let fetchWordSummary, fetchWordVerbs, fetchExactWordsInQuran, fetchWordsWithSameRoot;
	let chapter, verse, word;
	let wordRoot = '';

	// Split the key to get chapter, verse, and word numbers
	$: {
		const keySplit = data.key.split(':');
		chapter = +keySplit[0];
		verse = +keySplit[1];
		word = keySplit.length === 2 ? 1 : +keySplit[2];
		if (isNaN(word)) word = 1;
		__morphologyKey.set(`${chapter}:${verse}:${word}`);
	}

	// Fetch verse data based on chapter and verse
	$: fetchData = (async () => {
		const data = await fetchChapterData({ chapter, skipSave: true, reRenderWhenTheseUpdates: [$__fontType, $__wordTranslation, $__wordTransliteration] });
		return data[`${chapter}:${verse}`];
	})();

	// Fetch words data for morphology
	$: {
		// Fetch word verbs data
		fetchWordVerbs = (async () => {
			try {
				const response = await fetch(`${staticEndpoint}/morphology-data/word-verbs.json?version=1`);
				const data = await response.json();
				return data;
			} catch (error) {
				console.error(error);
				return {};
			}
		})();

		// Fetch word summary data
		fetchWordSummary = (async () => {
			try {
				const response = await fetch(`${staticEndpoint}/lexicon/word-summaries/${chapter}.json?version=1`);
				const data = await response.json();
				return data;
			} catch (error) {
				console.error(error);
				return {};
			}
		})();

		// Fetch exact words in Quran
		fetchExactWordsInQuran = (async () => {
			try {
				const [keyMapRes, exactMapRes] = await Promise.all([
					// key, arabic, english and transliteration data
					fetch(`${staticEndpoint}/morphology-data/word-keys-map.json?v=1`),

					// exact words in quran
					fetch(`${staticEndpoint}/morphology-data/exact-words-in-quran.json`)
				]);

				const keyMap = await keyMapRes.json();
				const exactMap = await exactMapRes.json();

				const keyToMeta = keyMap?.data || {};
				const uthmaniToKeys = exactMap?.data || {};

				const keyMeta = keyToMeta[$__morphologyKey];
				const uthmani = Array.isArray(keyMeta) ? keyMeta[0] : null;

				// Extract and save root for reuse
				wordRoot = Array.isArray(keyMeta) ? keyMeta[3] : '';

				if (!uthmani) return [];

				return (uthmaniToKeys[uthmani] || []).map((key) => {
					const meta = keyToMeta[key] || [];
					return {
						key,
						arabic: meta[0] || '',
						transliteration: meta[1] || '',
						translation: meta[2] || ''
					};
				});
			} catch (error) {
				console.error('Failed to load exact words in Quran:', error);
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
				<a href="/morphology/{+chapter - 1}:1" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('chapter')} {+chapter - 1}</a>
			{/if}

			<!-- next verse -->
			{#if verse > 1}
				<a href="/morphology/{chapter}:{+verse - 1}" class={buttonOutlineClasses}>{@html '&#x2190;'} {term('verse')} {chapter}:{+verse - 1}</a>
			{/if}

			<!-- previous verse -->
			{#if verse < quranMetaData[chapter].verses}
				<a href="/morphology/{chapter}:{+verse + 1}" class={buttonOutlineClasses}>{term('verse')} {chapter}:{+verse + 1} {@html '&#x2192;'}</a>
			{/if}

			<!-- next chapter -->
			{#if verse === quranMetaData[chapter].verses && chapter < 114}
				<a href="/morphology/{+chapter + 1}:1" class={buttonOutlineClasses}>{term('chapter')} {+chapter + 1} {@html '&#x2192;'}</a>
			{/if}
		</div>
	{/if}

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

	<div id="word-summary" class="text-center mx-auto md:w-3/4 text-sm md:text-lg pb-6 border-b-2 {window.theme('border')}">
		{#await fetchWordSummary}
			<span>...</span>
		{:then fetchWordSummary}
			<div class="flex flex-col space-y-4">
				<span>{@html fetchWordSummary[$__morphologyKey]}</span>
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
			<ErrorLoadingDataFromAPI center="false" />
		{/await}
	</div>

	<div id="word-details" class="flex flex-col">
		{#await fetchWordVerbs}
			<Spinner />
		{:then fetchWordVerbs}
			{#if fetchWordVerbs?.data?.hasOwnProperty($__morphologyKey)}
				<div id="word-forms" class="pb-8 pt-2 border-b-2 {window.theme('border')}">
					<div class="flex flex-col">
						<div id="different-verbs">
							<div class="mx-auto text-center">
								<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-6">
									{#each Object.entries(fetchWordVerbs.data[$__morphologyKey]) as [key, value]}
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
				</div>
			{/if}

			{#await (async () => {
				try {
					if (!wordRoot) return [];
					const sameRootRes = await fetch(`${staticEndpoint}/morphology-data/words-with-same-root/${wordRoot}.json`);
					const sameRootData = await sameRootRes.json();
					return sameRootData?.data || [];
				} catch (e) {
					console.error('Failed to load root words:', e);
					return [];
				}
			})()}
				<Spinner />
			{:then sameRootData}
				{#if sameRootData.length > 0}
					<div id="word-root-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
						<Table wordData={sameRootData} tableType={1} />
					</div>
				{:else}
					<p class="text-center py-6 opacity-60">No other words found with same root.</p>
				{/if}
			{:catch error}
				<ErrorLoadingDataFromAPI center="false" />
			{/await}

			{#await fetchExactWordsInQuran}
				<Spinner />
			{:then wordList}
				{#if Array.isArray(wordList) && wordList.length}
					<div id="exact-word-data" class="pb-8 pt-8 border-b-2 {window.theme('border')}">
						<Table wordData={wordList} tableType={2} />
					</div>
				{:else}
					<p class="text-center py-6 opacity-60">No matching words found in Quran.</p>
				{/if}
			{:catch error}
				<ErrorLoadingDataFromAPI center="false" />
			{/await}
		{:catch error}
			<ErrorLoadingDataFromAPI center="false" />
		{/await}
	</div>
</div>
