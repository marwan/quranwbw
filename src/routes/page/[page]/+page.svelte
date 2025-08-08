<script>
	export let data;

	import PageRenderer from './PageRenderer.svelte';
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Minimize from '$svgs/Minimize.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __pageNumber, __currentPage, __fontType, __wordTranslation, __displayType, __mushafMinimalModeEnabled } from '$utils/stores';
	import { staticEndpoint } from '$data/websiteSettings';
	import { quranMetaData } from '$data/quranMeta';
	import { selectableFontTypes } from '$data/options';
	import { toggleMushafMinimalMode } from '$utils/toggleMushafMinimalMode';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';
	import { fetchChapterData, fetchAndCacheJson } from '$utils/fetchData';
	import '$utils/swiped-events.min.js';

	const pagePairs = {
		1: [1, 2],
		2: [1, 2],
		3: [3, 4],
		4: [3, 4],
		5: [5, 6],
		6: [5, 6],
		7: [7, 8],
		8: [7, 8],
		9: [9, 10],
		10: [9, 10],
		603: [603, 604],
		604: [603, 604]
	};

	// Lines to be centered instead of justified
	const centeredPageLines = ['528:9', '545:6', '594:5', '602:5', '602:15', '603:10', '603:15', '604:4', '604:9', '604:14', '604:15'];

	let rightPageData;
	let leftPageData;

	let rightPageStartingLine;
	let rightPageEndingLine;
	let leftPageStartingLine;
	let leftPageEndingLine;

	let rightPageChapters = [];
	let rightPageVerses = [];
	let rightPageLines = [];

	let leftPageChapters = [];
	let leftPageVerses = [];
	let leftPageLines = [];

	let rightPageNumber;
	let leftPageNumber;

	// Set the page number
	$: page = +data.page;

	const bookModeEnabled = true;

	$: if (bookModeEnabled) {
		rightPageNumber = pagePairs[page][0];
		leftPageNumber = pagePairs[page][1];
	} else {
		rightPageNumber = page;
		leftPageNumber = page;
	}

	$: console.log({ page, rightPageNumber, leftPageNumber });

	// Prefetch adjacent pages for better UX
	$: if ([2, 3].includes($__fontType)) {
		for (let thisPage = +page - 2; thisPage <= +page + 2; thisPage++) {
			fetch(getMushafWordFontLink(thisPage));
		}
	}

	$: {
		__pageNumber.set(page);
	}

	$: {
		rightPageData = getPageData(rightPageNumber).then((data) => {
			rightPageChapters = data.chapters;
			rightPageVerses = data.verses;
			rightPageLines = data.lines;
			rightPageStartingLine = data.startingLine;
			rightPageEndingLine = data.endingLine;
			return data.verseData;
		});
	}

	$: {
		leftPageData = getPageData(leftPageNumber).then((data) => {
			leftPageChapters = data.chapters;
			leftPageVerses = data.verses;
			leftPageLines = data.lines;
			leftPageStartingLine = data.startingLine;
			leftPageEndingLine = data.endingLine;
			return data.verseData;
		});
	}

	async function getPageData(pageNumber) {
		const chapters = [];
		const verses = [];
		const lines = [];

		const data = await fetchVersesByPage(pageNumber, selectableFontTypes[$__fontType].id, $__wordTranslation);

		const verseData = data.verses;
		localStorage.setItem(`pageData-${pageNumber}`, JSON.stringify(verseData));

		const verseKeys = Object.keys(verseData);

		// First and last line
		const firstVerse = verseKeys[0];
		const lastVerse = verseKeys[verseKeys.length - 1];

		const startingLine = verseData[firstVerse].words.line[0];
		const endingLine = verseData[lastVerse].words.line.at(-1); // last line of last word

		// Unique chapter numbers
		for (const key of verseKeys) {
			const chapter = +key.split(':')[0];
			if (!chapters.includes(chapter)) {
				chapters.push(chapter);
			}
		}

		// First verse per chapter
		chapters.forEach((chapter) => {
			for (let verse = 1; verse <= quranMetaData[chapter].verses; verse++) {
				if (verseData[`${chapter}:${verse}`]) {
					verses.push(verse);
					break;
				}
			}
		});

		// Line numbers for chapters
		chapters.forEach((chapter, index) => {
			lines.push(+verseData[`${chapter}:${verses[index]}`].words.line[0]);
		});

		return {
			verseData,
			startingLine,
			endingLine,
			chapters,
			verses,
			lines
		};
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

<PageHead title={`Page ${rightPageNumber}-${leftPageNumber}`} />

<div id="page-block" class="text-center text-xl mt-6 mb-14 overflow-x-hidden overflow-y-hidden">
	{#await rightPageData && leftPageData}
		<Spinner />
	{:then}
		<div class="space-y-2 mt-2.5">
			<!-- Single page layout -->
			<div class="flex flex-row">
				<PageRenderer pageNumber={leftPageNumber} chapters={leftPageChapters} verses={leftPageVerses} lines={leftPageLines} startingLine={leftPageStartingLine} endingLine={leftPageEndingLine} dataKey={`pageData-${leftPageNumber}`} fontType={$__fontType} {centeredPageLines} />

				{#if bookModeEnabled}
					<PageRenderer pageNumber={rightPageNumber} chapters={rightPageChapters} verses={rightPageVerses} lines={rightPageLines} startingLine={rightPageStartingLine} endingLine={rightPageEndingLine} dataKey={`pageData-${rightPageNumber}`} fontType={$__fontType} {centeredPageLines} />
				{/if}
			</div>

			<!-- page number -->
			<div class="mx-auto justify-center text-sm">
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
