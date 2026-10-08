<script>
	export let data;

	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import Table from '../morphology/Table.svelte';
	import { morphologyDataUrls } from '$data/websiteSettings';
	import { __wordTranslation, __wordTransliteration, __currentPage } from '$utils/stores';
	import { fetchAndCacheJson, fetchWordData } from '$utils/fetchData';
	import { fade } from 'svelte/transition';
	import { isUserOnline } from '$utils/offlineModeHandler';
	import { onMount } from 'svelte';

	// the arabic root, taken straight from the url (e.g. /root/سمو -> "سمو")
	$: root = data?.root || 'سمو';

	// maps each arabic letter to its transliteration - used for the split-letter header only.
	// add any missing letters here if a root ever uses one that's not listed
	const letterTransliteration = {
		ا: 'alif',
		ب: 'bāʾ',
		ت: 'tāʾ',
		ث: 'thāʾ',
		ج: 'jīm',
		ح: 'ḥāʾ',
		خ: 'khāʾ',
		د: 'dāl',
		ذ: 'dhāl',
		ر: 'rāʾ',
		ز: 'zāy',
		س: 'sīn',
		ش: 'shīn',
		ص: 'ṣād',
		ض: 'ḍād',
		ط: 'ṭāʾ',
		ظ: 'ẓāʾ',
		ع: 'ʿayn',
		غ: 'ghayn',
		ف: 'fāʾ',
		ق: 'qāf',
		ك: 'kāf',
		ل: 'lām',
		م: 'mīm',
		ن: 'nūn',
		ه: 'hāʾ',
		و: 'wāw',
		ي: 'yāʾ',
		ء: 'hamza',
		ة: 'tāʾ marbūṭah',
		ى: 'alif maqṣūrah'
	};

	// splits the root into individual letters for the header, e.g. "سمو" -> [س, م, و]
	$: rootLetters = root ? [...root] : [];

	// network tracker - same pattern used on the morphology page
	let userOnline = false;
	let networkCheckPerformed = false;

	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// null-safety helpers - any field in the root json can be null/missing

	// returns the value if it is an array, otherwise an empty array
	function asArray(value) {
		return Array.isArray(value) ? value : [];
	}

	// returns the value if it is a non-empty string, otherwise null
	function asText(value) {
		return typeof value === 'string' && value.trim() !== '' ? value : null;
	}

	// fetch everything this page needs, in parallel
	$: allDataPromise = (async () => {
		// detailed root info, from our static root-details json
		const rootInfoPromise = fetch(morphologyDataUrls.getRootInformation(encodeURIComponent(root))).then((res) => {
			if (!res.ok) throw new Error(`Root details returned ${res.status}`);
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
			<!-- everything below is derived from the json and guarded against null/missing values -->
			{@const info = allData.rootInfo ?? {}}
			{@const lexicon = info.lexicon ?? {}}
			{@const rootMeaning = asText(info.root_meaning)}
			{@const alternateMeaning = asText(info.alternate_root_meaning)}
			{@const definitions = asArray(info.definitions).filter((d) => asText(d))}
			{@const lemmas = asArray(info.lemmas).filter((l) => asText(l))}
			{@const derivatives = asArray(info.derivatives).filter((d) => d && asText(d.form))}
			{@const entries = asArray(lexicon.entries).filter((e) => e && asText(e.html))}
			{@const grammar = asText(lexicon.grammar)}
			{@const note = asText(lexicon.note)}
			{@const rootHtml = asText(lexicon.rootHtml)}
			{@const mainHtml = asText(lexicon.mainHtml)}
			{@const statItems = [
				{ label: 'Total Occurrences', value: allData.wordsWithSameRootData?.data?.[root]?.length },
				{ label: 'Derivative Count', value: Array.isArray(info.derivatives) ? derivatives.length : undefined },
				{ label: 'Lemma Count', value: Array.isArray(info.lemmas) ? lemmas.length : undefined }
			].filter((item) => typeof item.value === 'number')}

			<div class="my-4" in:fade={{ duration: 300 }}>
				<!-- root header - the only centered part of the page -->
				<div id="root-header" class="text-center pb-8 border-b border-theme-accent/20">
					<p class="text-4xl md:text-5xl arabic-font-1 leading-loose">{asText(info.root) || root}</p>

					<div class="flex justify-center gap-6 md:gap-8 mt-2">
						{#each rootLetters as letter}
							<div class="flex flex-col items-center">
								<span class="text-2xl md:text-3xl arabic-font-1">{letter}</span>
								<span class="text-xs md:text-sm">{letterTransliteration[letter] || letter}</span>
							</div>
						{/each}
					</div>

					{#if rootMeaning}
						<p class="mt-3 text-sm md:text-base capitalize">{rootMeaning}</p>
					{/if}
				</div>

				<div id="root-details">
					<!-- stats: total occurrences (words sharing this root), derivative count, lemma count -->
					{#if statItems.length}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Stats</h3>

							<p class="text-sm md:text-base">
								{#each statItems as item, i}
									<span>{item.label}:</span> <span class="font-medium">{item.value}</span>{i < statItems.length - 1 ? ' · ' : ''}
								{/each}
							</p>
						</div>
					{/if}

					<!-- derivatives - flat inline form/count list -->
					{#if derivatives.length}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Derivatives</h3>

							<p class="text-sm md:text-base">
								{#each derivatives as derivative, i}
									<span class="arabic-font-1 text-base md:text-lg">{derivative.form}</span>
									{#if typeof derivative.count === 'number'}<span>({derivative.count})</span>{/if}{i < derivatives.length - 1 ? ' · ' : ''}
								{/each}
							</p>
						</div>
					{/if}

					<!-- lemmas - flat inline list -->
					{#if lemmas.length}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Lemmas</h3>

							<p class="arabic-font-1 text-base md:text-lg">
								{lemmas.join('  ·  ')}
							</p>
						</div>
					{/if}

					<!-- lane's lexicon definitions - long-form english text with embedded arabic terms -->
					{#if definitions.length}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Lexicon Definition</h3>

							<div class="text-sm md:text-base leading-relaxed space-y-4">
								{#each definitions as definition}
									<p>{definition}</p>
								{/each}
							</div>
						</div>
					{/if}

					<!-- grammar + derivative note -->
					{#if grammar || note}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Grammar</h3>

							{#if grammar}
								<p class="text-sm md:text-base capitalize">{grammar}</p>
							{/if}

							{#if note}
								<p class="text-sm md:text-base mt-1">{@html note}</p>
							{/if}
						</div>
					{/if}

					<!-- root definition (html, contains the root breakdown + form counts) -->
					{#if rootHtml}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Root Definition</h3>

							<div class="text-sm md:text-base leading-relaxed">
								{@html rootHtml}
							</div>
						</div>
					{/if}

					<!-- alternate root meaning -->
					{#if alternateMeaning}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Alternate Root Meaning</h3>

							<p class="text-sm md:text-base">
								{alternateMeaning}
							</p>
						</div>
					{/if}

					<!-- main definition (html, contains numbered senses + example ayahs) -->
					{#if mainHtml}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Main Definition</h3>

							<div class="text-sm md:text-base leading-relaxed">
								{@html mainHtml}
							</div>
						</div>
					{/if}

					<!-- every entry (root itself + each derived form) - no cards, just a divided stack -->
					{#if entries.length}
						<div class="py-6 border-b border-theme-accent/20">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">All Entries</h3>

							<div class="divide-y divide-theme-accent/20">
								{#each entries as entry}
									<div class="py-3">
										{#if asText(entry.label)}
											<p class="arabic-font-1 text-base md:text-lg mb-1">{entry.label}</p>
										{/if}
										<div class="text-sm md:text-base leading-relaxed">{@html entry.html}</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- words with same root - reusing the existing Table component, tableType 1 like the morphology page -->
					{#if allData?.wordsWithSameRootData?.data && root in allData.wordsWithSameRootData.data}
						<div class="py-6">
							<h3 class="text-sm uppercase tracking-wide font-medium mb-3">Words With Same Root</h3>

							<Table wordKeys={allData.wordsWithSameRootData.data[root]} tableType={1} wordData={allData.wordData} showTableTitle={false} />
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
