<script>
	export let data;

	import Bismillah from '$misc/Bismillah.svelte';
	import ChapterHeader from '$misc/ChapterHeader.svelte';
	import PageHead from '$misc/PageHead.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Minimize from '$svgs/Minimize.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { goto } from '$app/navigation';
	import { __pageNumber, __currentPage, __fontType, __wordTranslation, __mushafPageDivisions, __displayType, __mushafMinimalModeEnabled } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { staticEndpoint } from '$data/websiteSettings';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableFontTypes } from '$data/options';
	import { toggleMushafMinimalMode } from '$utils/toggleMushafMinimalMode';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';
	import { fetchChapterData, fetchAndCacheJson } from '$utils/fetchData';
	import '$utils/swiped-events.min.js';

	// Lines to be centered instead of justified
	const centeredPageLines = ['528:9', '545:6', '594:5', '602:5', '602:15', '603:10', '603:15', '604:4', '604:9', '604:14', '604:15'];

	let pageData;
	let startingLine;
	let endingLine;
	let chapters = [];
	let verses = [];
	let lines = [];

	// Set the page number
	$: page = +data.page;

	// Prefetch adjacent pages for better UX
	$: if ([2, 3].includes($__fontType)) {
		for (let thisPage = +page - 2; thisPage <= +page + 2; thisPage++) {
			fetch(getMushafWordFontLink(thisPage));
		}
	}

	$: {
		chapters = [];
		verses = [];
		lines = [];

		pageData = (async () => {
			const data = await fetchVersesByPage(page, selectableFontTypes[$__fontType].id, $__wordTranslation);
			const verseData = data.verses;
			localStorage.setItem('pageData', JSON.stringify(verseData));

			// Get the first line, of the first word, of the first verse
			const firstVerse = Object.keys(verseData)[0];
			startingLine = verseData[firstVerse].words.line[0];

			// Get the last line, of the last word, of the last verse
			const lastVerse = Object.keys(verseData)[Object.keys(verseData).length - 1];
			const lastWord = verseData[lastVerse].words.line;
			endingLine = lastWord[lastWord.length - 1];

			// Get chapter numbers
			for (const key of Object.keys(verseData)) {
				const chapter = +key.split(':')[0];
				if (!chapters.includes(chapter)) {
					chapters.push(chapter);
				}
			}

			// Get the first verse of each chapter
			chapters.forEach((chapter) => {
				for (let verse = 1; verse <= quranMetaData[chapter].verses; verse++) {
					if (verseData[`${chapter}:${verse}`]) {
						verses.push(verse);
						break;
					}
				}
			});

			// Get line numbers for chapters
			chapters.forEach((chapter, index) => {
				lines.push(+verseData[`${chapter}:${verses[index]}`].words.line[0]);
			});

			// Set the mushaf page divisions
			__mushafPageDivisions.set({
				chapters: chapters,
				juz: verseData[Object.keys(verseData)[0]].meta.juz
			});

			// Update the last read page
			updateSettings({ type: 'lastRead', value: verseData[Object.keys(verseData)[0]].meta });

			// Event listeners for swipe gestures
			const pageBlock = document.getElementById('page-block');
			pageBlock.addEventListener('swiped-left', () => goto(`/page/${page === 1 ? 1 : page - 1}`, { replaceState: false }));
			pageBlock.addEventListener('swiped-right', () => goto(`/page/${page === 604 ? 604 : page + 1}`, { replaceState: false }));

			return verseData;
		})();

		// Update the page number
		__pageNumber.set(page);
	}

	/**
	 * This function retrieves and processes Quranic verses for a given page number.
	 * It first fetches a JSON file (`keysInPage.json`) containing verse keys mapped to pages,
	 * then extracts the specific chapters and verses required for the given page.
	 * After identifying the necessary chapters, it fetches their complete data
	 * and filters out only the requested verses. The function then ensures that the verses
	 * are sorted in ascending order based on chapter and verse numbers before returning
	 * the final structured object. This provides well-organized data for further use.
	 */
	async function fetchVersesByPage(page) {
		try {
			// Fetch keys for the given page
			const keysData = await fetchAndCacheJson(`${staticEndpoint}/meta/keysInPage.json?version=2`, 'other');
			const keysInPage = keysData[page];

			// Parse keys into chapters and verses
			const chaptersWithVerses = {};
			keysInPage.split(',').forEach((key) => {
				const [chapter, verse] = key.split(':').map(Number);
				if (!chaptersWithVerses[chapter]) {
					chaptersWithVerses[chapter] = [];
				}
				if (!chaptersWithVerses[chapter].includes(verse)) {
					chaptersWithVerses[chapter].push(verse);
				}
			});

			// Fetch data for each chapter and filter required verses
			let stitchedVerses = {};

			const fetchPromises = Object.entries(chaptersWithVerses).map(async ([chapter, verses]) => {
				try {
					const data = await fetchChapterData({ chapter, preventStoreUpdate: true });

					// Filter only the required verses
					verses.forEach((verse) => {
						const verseKey = `${chapter}:${verse}`;
						if (data[verseKey]) {
							stitchedVerses[verseKey] = data[verseKey]; // Add only needed verses
						}
					});
				} catch (error) {
					console.warn(`Error fetching Chapter ${chapter}:`, error);
				}
			});

			await Promise.all(fetchPromises); // Wait for all fetch requests to complete

			// Sort the verses in ascending order before returning
			const sortedVerses = Object.keys(stitchedVerses)
				.sort((a, b) => {
					const [chapterA, verseA] = a.split(':').map(Number);
					const [chapterB, verseB] = b.split(':').map(Number);
					return chapterA - chapterB || verseA - verseB;
				})
				.reduce((obj, key) => {
					obj[key] = stitchedVerses[key];
					return obj;
				}, {});

			return { verses: sortedVerses };
		} catch (error) {
			console.warn('Error fetching data:', error);
			return { verses: {} };
		}
	}

	// Only allow continuous normal mode, without saving the setting
	$__displayType = 4;

	// Set the current page to 'mushaf'
	__currentPage.set('mushaf');
</script>

<PageHead title={`Page ${page}`} />

<div id="page-block" class="text-center text-xl mt-6 mb-14 overflow-x-hidden overflow-y-hidden">
	{#await pageData}
		<Spinner />
	{:then}
		<div class="space-y-2 mt-2.5">
			<!-- single page -->
			<div class="max-w-3xl md:max-w-[40rem] pb-2 mx-auto text-[5.4vw] md:text-[36px] lg:text-[36px] {+page === 1 ? 'space-y-1' : 'space-y-2'}">
				{#each Array.from(Array(endingLine + 1).keys()).slice(startingLine) as line}
					<!-- show the chapter header if it's the first verse of that chapter -->
					{#if chapters.length > 0 && lines.includes(line) && verses[lines.indexOf(line)] === 1}
						<div class="flex flex-col my-2">
							<ChapterHeader chapter={chapters[lines.indexOf(line)]} />
							<Bismillah {chapters} {lines} {line} />
						</div>
					{/if}

					<div class="line {line} flex px-2 arabic-font-{$__fontType} {+page < 3 || centeredPageLines.includes(`${+page}:${line}`) ? 'justify-center' : null} {+page > 2 && !centeredPageLines.includes(`${+page}:${line}`) ? 'justify-between' : null}">
						{#each Object.entries(JSON.parse(localStorage.getItem('pageData'))) as [key, value]}
							<WordsBlock {key} {value} {line} />
						{/each}
					</div>
				{/each}
			</div>

			<!-- page number -->
			<div class="max-w-3xl md:max-w-[40rem] mx-auto justify-center text-sm">
				<div class="flex items-center">
					<div class="flex-1 border-t-2 {window.theme('border')}"></div>
					<span class="px-3">{page}</span>
					<div class="flex-1 border-t-2 {window.theme('border')}"></div>
				</div>
			</div>
		</div>
	{:catch error}
		<ErrorLoadingData {error} />
	{/await}
</div>

<!-- only show the minimize minimal mode button when it is enabled -->
{#if $__mushafMinimalModeEnabled}
	<div class="flex justify-center -mt-12 pb-16">
		<button class="w-fit flex flex-row space-x-2 py-3 px-3 rounded-xl items-center cursor-pointer {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" on:click={toggleMushafMinimalMode} data-umami-event="Mushaf Minimal Mode Button">
			<Minimize size={3} />
		</button>
		<Tooltip arrow={false} type="light" class="z-30 hidden md:block font-normal">Minimal Mode</Tooltip>
	</div>
{/if}
