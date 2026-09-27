<script>
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	// NOTE: adjust this import path to wherever Table.svelte actually lives relative to this new route
	import Table from '../morphology/Table.svelte';
	import { morphologyDataUrls } from '$data/websiteSettings';
	import { __wordTranslation, __wordTransliteration, __currentPage } from '$utils/stores';
	import { fetchAndCacheJson, fetchWordData } from '$utils/fetchData';
	import { fade } from 'svelte/transition';
	import { isUserOnline } from '$utils/offlineModeHandler';
	import { onMount } from 'svelte';

	// the arabic root, taken straight from the url (e.g. /root/سمو -> "سمو")
	$: root = 'سمو';

	// network tracker - same pattern used on the morphology page
	let userOnline = false;
	let networkCheckPerformed = false;

	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// turns "totalOccurrences" into "total occurrences" for display in the stats block
	function humanizeKey(key) {
		return key.replace(/([A-Z])/g, ' $1').trim();
	}

	// fetch everything this page needs, in parallel
	$: allDataPromise = (async () => {
		// detailed root info, straight from the API
		const rootInfoPromise = fetch(`http://localhost:7500/v2/root-details?root=${encodeURIComponent(root)}`).then((res) => {
			if (!res.ok) throw new Error(`Root details API returned ${res.status}`);
			return res.json();
		});

		// map of root -> word keys, used for the "words with same root" table
		const wordsWithSameRootDataPromise = fetchAndCacheJson(morphologyDataUrls.wordsWithSameRootKeys, 'morphology').catch(() => ({}));

		// arabic / translation / transliteration data needed by <Table />
		const wordDataPromise = fetchWordData(1, $__wordTranslation, $__wordTransliteration).catch(() => ({}));

		const [rootInfo, wordsWithSameRootData, wordData] = await Promise.all([rootInfoPromise, wordsWithSameRootDataPromise, wordDataPromise]);

		return { rootInfo, wordsWithSameRootData, wordData };
	})();

	__currentPage.set('root');
</script>

{#if networkCheckPerformed}
	{#if userOnline}
		{#await allDataPromise}
			<Spinner />
		{:then allData}
			{@const info = allData.rootInfo}
			<div class="space-y-6 my-8" in:fade={{ duration: 300 }}>
				<!-- root header - just the root itself, no verse/word display like the normal morphology page -->
				<div id="root-header" class="text-center">
					<p class="text-4xl md:text-5xl arabic-font-1 leading-loose">{info.rootArabic || root}</p>

					{#if info.rootMeaning}
						<p class="mt-2 text-sm md:text-lg opacity-70 capitalize">{info.rootMeaning}</p>
					{/if}
				</div>

				<div id="root-details" class="flex flex-col">
					<!-- core meanings -->
					{#if info.coreMeanings?.length}
						<div id="core-meanings" class="pb-8 pt-2 border-b-2 border-theme-accent/20">
							<h3 class="text-center text-sm uppercase tracking-wide opacity-60 mb-4">Core Meanings</h3>

							<div class="flex flex-wrap justify-center gap-2">
								{#each info.coreMeanings as meaning}
									<span class="px-3 py-1 rounded-full bg-theme-bg border border-theme-accent/20 text-xs md:text-sm">{meaning}</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- stats: total occurrences, derivative count, surah count, ayah count -->
					{#if info.stats}
						<div id="root-stats" class="pb-8 pt-8 border-b-2 border-theme-accent/20">
							<div class="mx-auto text-center">
								<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-4">
									{#each Object.entries(info.stats) as [key, value]}
										<div class="flex flex-col py-5 duration-300 transform bg-theme-bg border border-theme-accent/20 rounded-3xl shadow-sm text-center hover:-translate-y-2">
											<p class="text-xl md:text-2xl pb-2 font-semibold">{value}</p>
											<p class="text-xs capitalize opacity-70">{humanizeKey(key)}</p>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					<!-- derivatives grid - same card style as the existing "different verbs" block -->
					{#if info.derivatives?.length}
						<div id="root-derivatives" class="pb-8 pt-8 border-b-2 border-theme-accent/20">
							<h3 class="text-center text-sm uppercase tracking-wide opacity-60 mb-4">Derivatives</h3>

							<div class="mx-auto text-center">
								<div class="relative grid gap-4 grid-cols-2 row-gap-3 md:row-gap-4 md:grid-cols-4">
									{#each info.derivatives as derivative}
										<div class="flex flex-col py-5 duration-300 transform bg-theme-bg border border-theme-accent/20 rounded-3xl shadow-sm text-center hover:-translate-y-2">
											<p class="text-xl md:text-2xl pb-2 arabic-font-1">{derivative.form}</p>
											<p class="text-xs opacity-70">{derivative.count} occurrences</p>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}

					<!-- lemmas -->
					{#if info.lemmas?.length}
						<div id="root-lemmas" class="pb-8 pt-8 border-b-2 border-theme-accent/20">
							<h3 class="text-center text-sm uppercase tracking-wide opacity-60 mb-4">Lemmas</h3>

							<div class="flex flex-wrap justify-center gap-3">
								{#each info.lemmas as lemma}
									<span class="px-4 py-2 rounded-3xl bg-theme-bg border border-theme-accent/20 arabic-font-1 text-lg">{lemma}</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- lane's lexicon definitions - long-form english text with embedded arabic terms -->
					{#if info.definitions?.length}
						<div id="root-definitions" class="pb-8 pt-8 border-b-2 border-theme-accent/20">
							<h3 class="text-center text-sm uppercase tracking-wide opacity-60 mb-4">Lexicon Definition</h3>

							<div class="mx-auto md:w-3/4 text-sm leading-relaxed space-y-4">
								{#each info.definitions as definition}
									<p>{definition}</p>
								{/each}
							</div>
						</div>
					{/if}

					{#if info.lexSnapshot}
						<!-- grammar + derivative note -->
						<div id="lex-snapshot-summary" class="pb-8 pt-8 border-b-2 border-theme-accent/20 text-center mx-auto md:w-3/4 text-sm md:text-base">
							{#if info.lexSnapshot.wordGrammar}
								<p class="capitalize opacity-70">{info.lexSnapshot.wordGrammar}</p>
							{/if}

							{#if info.lexSnapshot.derivativeNote}
								<p class="mt-2">{@html info.lexSnapshot.derivativeNote}</p>
							{/if}
						</div>

						<!-- root definition (html, contains the root breakdown + form counts) -->
						{#if info.lexSnapshot.rootDefinitionHtml}
							<div id="lex-root-definition" class="pb-8 pt-8 border-b-2 border-theme-accent/20 mx-auto md:w-3/4 text-sm leading-relaxed">
								{@html info.lexSnapshot.rootDefinitionHtml}
							</div>
						{/if}

						<!-- main definition (html, contains numbered senses + example ayahs) -->
						{#if info.lexSnapshot.mainDefinitionHtml}
							<div id="lex-main-definition" class="pb-8 pt-8 border-b-2 border-theme-accent/20 mx-auto md:w-3/4 text-sm leading-relaxed">
								{@html info.lexSnapshot.mainDefinitionHtml}
							</div>
						{/if}

						<!-- every entry (root itself + each derived form), one card each -->
						{#if info.lexSnapshot.entries?.length}
							<div id="lex-entries" class="pb-8 pt-8 border-b-2 border-theme-accent/20">
								<h3 class="text-center text-sm uppercase tracking-wide opacity-60 mb-4">All Entries</h3>

								<div class="flex flex-col space-y-6">
									{#each info.lexSnapshot.entries as entry (entry.id)}
										<div class="p-4 rounded-3xl bg-theme-bg border border-theme-accent/20 {entry.isMain ? 'ring-2 ring-theme-accent/40' : ''}">
											<p class="text-center arabic-font-1 text-lg mb-2">{entry.label}</p>
											<div class="text-sm leading-relaxed mx-auto md:w-3/4">{@html entry.definitionHtml}</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}

					<!-- words with same root - reusing the existing Table component, tableType 1 like the morphology page -->
					{#if allData?.wordsWithSameRootData?.data && root in allData.wordsWithSameRootData.data}
						<div id="words-with-same-root" class="pb-8 pt-8">
							<Table wordKeys={allData.wordsWithSameRootData.data[root]} tableType={1} wordData={allData.wordData} />
						</div>
					{/if}
				</div>
			</div>
		{:catch error}
			<ErrorLoadingData {error} />
		{/await}
	{:else}
		<ErrorLoadingData center={true} />
	{/if}
{/if}
