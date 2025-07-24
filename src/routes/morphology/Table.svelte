<script>
	export let wordKeys = [];
	export let tableType;
	export let wordData;

	import { buttonClasses, linkClasses } from '$data/commonClasses';
	import { term } from '$utils/terminologies';

	const tableTitles = {
		1: { title: 'with the same root' },
		2: { title: 'appearing exactly' }
	};

	const params = new URLSearchParams(window.location.search);
	const loadAll = params.get('load_all') === 'true';

	// Fallbacks
	const sanitizedwordKeys = Array.isArray(wordKeys) ? wordKeys : [];
	const totalAvailableWords = sanitizedwordKeys.length;
	const maxResultsToLoad = 50;

	let lastWordToLoad = calculateInitialLastWordToLoad(loadAll, totalAvailableWords, maxResultsToLoad);

	function calculateInitialLastWordToLoad(loadAll, totalAvailableWords, maxResultsToLoad) {
		return loadAll ? totalAvailableWords : Math.min(totalAvailableWords, maxResultsToLoad);
	}

	function updateLastWordToLoad() {
		lastWordToLoad = Math.min(lastWordToLoad + 50, totalAvailableWords);
	}
</script>

{#if totalAvailableWords > 0}
	<div class="flex flex-col">
		<div class="relative space-y-6 sm:rounded-3xl">
			<h1 class="text-md md:text-2xl text-center">{totalAvailableWords} {totalAvailableWords > 1 ? 'words' : 'word'} {tableTitles[tableType].title}</h1>
			<div class="max-h-[32em] overflow-auto">
				<table class="w-full text-sm text-left rtl:text-right rounded-md">
					<thead class="text-xs uppercase top-0 {window.theme('bgSecondaryLight')}">
						<tr>
							<th class="px-6 py-3">#</th>
							<th class="px-6 py-3">Word</th>
							<th class="px-6 py-3">Translation</th>
							<th class="px-6 py-3">Transliteration</th>
							<th class="px-6 py-3">{term('verse')}</th>
							<th class="px-6 py-3">Word</th>
						</tr>
					</thead>
					<tbody>
						{#each sanitizedwordKeys.slice(0, lastWordToLoad) as item, i}
							{@const [chapter, verse, word] = item.split(':')}
							{@const arabic = wordData.arabicWordData[chapter][verse][0][word - 1]}
							{@const translation = wordData.translationWordData[chapter][verse][0][word - 1]}
							{@const transliteration = wordData.transliterationWordData[chapter][verse][0][word - 1]}
							<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {window.theme('hover')}">
								<td class="px-6 py-4">{i + 1}</td>
								<td class="px-6 py-4 text-xl md:text-2xl arabic-font-1">{arabic}</td>
								<td class="px-6 py-4">{translation}</td>
								<td class="px-6 py-4">{transliteration}</td>
								<td class="px-6 py-4">
									<a class={linkClasses} href="/{chapter}?startVerse={verse}">{chapter}:{verse}</a>
								</td>
								<td class="px-6 py-4">
									<a class={linkClasses} href="/morphology?word={item}">{item}</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalAvailableWords > maxResultsToLoad}
				<div class="text-center text-xs {lastWordToLoad === totalAvailableWords && 'hidden'}">
					<button on:click={updateLastWordToLoad} class={buttonClasses} data-umami-event="Morphology Load More Button"> Load more </button>
				</div>
			{/if}
		</div>
	</div>
{/if}
