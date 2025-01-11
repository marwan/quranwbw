<script>
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import CrossSolid from '$svgs/CrossSolid.svelte';
	import AscendingSort from '$svgs/AscendingSort.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { quranMetaData, mostRead } from '$data/quranMeta';
	import { __lastRead, __favouriteChapters, __userBookmarks, __userNotes, __timeSpecificChapters, __siteNavigationModalVisible, __quranNavigationModalVisible } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { staticEndpoint } from '$data/websiteSettings';

	// CSS classes for chapter cards and tabs
	const cardGridClasses = 'grid md:grid-cols-2 lg:grid-cols-3 gap-3';
	const cardInnerClasses = `flex justify-between md:text-left transition text-sm rounded-xl p-5 hover:cursor-pointer ${window.theme('bgSecondaryLight')} ${window.theme('hover')}`;

	// Tab classes
	const commontabClasses = 'px-2 md:px-3 py-2 text-xs md:text-md border-b-4 cursor-pointer';
	const tabDefaultBorder = `${commontabClasses} border-transparent`;
	const tabActiveBorder = `${commontabClasses} ${window.theme('border')}`;

	let activeTab = 1; // Default to chapters tab
	let chapterSortIsAscending = true;
	let chapterListOrder = [...quranMetaData];
	let fullQuranData;

	// Fetch full Quran data (uthmani) for bookmarked verses
	$: if (activeTab === 3 && totalBookmarks !== 0) {
		fullQuranData = (async () => {
			try {
				const response = await fetch(`${staticEndpoint}/full-quran/uthmani.json`);
				const data = await response.json();
				return data.data;
			} catch (error) {
				// ...
			}
		})();
	}

	$: totalBookmarks = $__userBookmarks.length;
	$: totalNotes = Object.keys($__userNotes).length;

	// Remove 'invisible' class from chapter icons once fonts are loaded
	document.fonts.ready.then(() => {
		document.querySelectorAll('.chapter-icons').forEach((element) => {
			element.classList.remove('invisible');
		});
	});

	// Function to sort the chapter list in ascending or descending order
	function sortChapters() {
		chapterSortIsAscending = !chapterSortIsAscending;
		chapterListOrder = chapterSortIsAscending ? [...quranMetaData] : [...quranMetaData].reverse();

		// Ensure chapter icons are visible after sorting
		setTimeout(() => {
			document.querySelectorAll('.chapter-icons').forEach((element) => {
				element.classList.remove('invisible');
			});
		}, 10);
	}
</script>

<div id="homepage-tabs" style="margin-top: 0px;">
	<div class="flex items-center justify-center">
		<div class="flex flex-row justify-center">
			<!-- main tabs -->
			<div id="tab-buttons" class="pt-4">
				<div class="flex text-sm font-medium text-center mt-4 -mb-4 justify-center space-x-1 md:space-x-4 rounded-full px-4 py-2">
					<button on:click={() => (activeTab = 1)} class="{activeTab === 1 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" type="button">
						<div class="flex flex-row">
							<button class="inline-flex p-2 rounded-full items-center {window.theme('bgSecondaryDark')}" on:click={() => sortChapters()}>
								<span><AscendingSort size={3} /></span>
								<span class="sr-only">Sort</span>
							</button>
							<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">Sort Asc/Dsc</Tooltip>
						</div>
						<span>{term('chapters')}</span>
					</button>
					<button on:click={() => (activeTab = 2)} class={activeTab === 2 ? tabActiveBorder : tabDefaultBorder} type="button">Suggested</button>
					<button on:click={() => (activeTab = 3)} class="{activeTab === 3 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" type="button">
						<span>Bookmarks</span>
						<span class="hidden xs:block">{totalBookmarks > 0 ? `(${totalBookmarks})` : ''}</span>
					</button>
					<button on:click={() => (activeTab = 4)} class="{activeTab === 4 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" type="button">
						<span>Notes</span>
						<span class="hidden xs:block">{totalNotes > 0 ? `(${totalNotes})` : ''}</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- <div class="hidden md:block h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent to-transparent opacity-20 -mt-4 mx-auto {window.theme('via')}"></div> -->

	<div id="content-tab" class="my-6 px-">
		<!-- chapters tab -->
		<div class="homepage-tab-panels {activeTab === 1 ? 'block' : 'hidden'}" id="chapters-tab-panel" role="tabpanel" aria-labelledby="chapters-tab">
			<!-- surahs tab -->
			<div class="{cardGridClasses} grid-cols-1">
				{#each chapterListOrder as { id }, i}
					{#if id > 0}
						<a href="/{id}">
							<div class="{cardInnerClasses} flex-row text-center items-center">
								<div class="flex flex-row space-x-2">
									<div class="flex items-center">
										<!-- chapter number star -->
										<svg class="w-10 h-10 rounded-full flex items-center justify-center" fill={window.theme('icon')} viewBox="0 0 24 24">
											<path
												class="opacity-15"
												d="M21.77,8.948a1.238,1.238,0,0,1-.7-1.7,3.239,3.239,0,0,0-4.315-4.316,1.239,1.239,0,0,1-1.7-.7,3.239,3.239,0,0,0-6.1,0,1.238,1.238,0,0,1-1.7.7A3.239,3.239,0,0,0,2.934,7.249a1.237,1.237,0,0,1-.7,1.7,3.24,3.24,0,0,0,0,6.1,1.238,1.238,0,0,1,.705,1.7A3.238,3.238,0,0,0,7.25,21.066a1.238,1.238,0,0,1,1.7.7,3.239,3.239,0,0,0,6.1,0,1.238,1.238,0,0,1,1.7-.7,3.239,3.239,0,0,0,4.316-4.315,1.239,1.239,0,0,1,.7-1.7,3.239,3.239,0,0,0,0-6.1Z"
											/>
											<text x="50%" y="53%" text-anchor="middle" stroke={window.theme('icon')} stroke-width="0.5px" dy=".3em" class="text" style="font-size: 7px;">{id}</text>
										</svg>
									</div>

									<div class="text-left">
										<!-- chapter name and icon -->
										<div class="flex flex-row items-center space-x-1 justify-start truncate">
											<div>{quranMetaData[id].transliteration}</div>
											<div><svelte:component this={quranMetaData[id].revelation === 1 ? Mecca : Madinah} /></div>
											<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">{quranMetaData[id].revelation === 1 ? term('meccan') : term('medinan')} revelation</Tooltip>
										</div>

										<!-- chapter translation -->
										<div class="block text-xs truncate opacity-70">
											{quranMetaData[id].translation}
										</div>

										<!-- chapter verses -->
										<div class="block text-xs opacity-70">
											{quranMetaData[id].verses}
											{term('verses')}
										</div>
									</div>
								</div>

								<div class="invisible chapter-icons justify-items-end text-5xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[id].icon};`}</div>
							</div>
						</a>
					{/if}
				{/each}
			</div>
		</div>

		<!-- suggestions tab -->
		<div class="homepage-tab-panels space-y-12 {activeTab === 2 ? 'block' : 'hidden'}" id="suggestions-tab-panel" role="tabpanel" aria-labelledby="suggestions-tab">
			<div id="suggestions-chapters" class="flex flex-col space-y-4">
				<div class="{cardGridClasses} grid-cols-1">
					{#each Object.entries(mostRead) as [id, item]}
						<a href={item.url} class="!justify-start {cardInnerClasses} flex-col">
							<span class="text-sm">{quranMetaData[item.chapter].transliteration} ({item.verses})</span>
							<div class="block text-xs opacity-70">{item.title}</div>
						</a>
					{/each}
				</div>

				<div class="px-2 text-xs opacity-70">Suggestions listed here are based on the most frequently read chapters and verses by muslim audience, as well as virtues derived from Hadiths. While some Hadiths highlighting these virtues may be considered weak by some scholars, using them for beneficial knowledge is also a widely accepted opinion.</div>
			</div>
		</div>

		<!-- bookmarks tab -->
		<div class="bookmarks-tab-panels space-y-12 {activeTab === 3 ? 'block' : 'hidden'}" id="bookmarks-tab-panel" role="tabpanel" aria-labelledby="bookmarks-tab">
			<div id="bookmark-cards" class="flex flex-col space-y-4">
				{#if totalBookmarks === 0}
					<div class="flex items-center justify-center text-sm">You currently do not have any bookmarks.</div>
				{:else}
					<div class="{cardGridClasses} grid-cols-1">
						{#each $__userBookmarks as bookmark}
							{@const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number)}

							<div class="flex flex-row space-x-2">
								<a href="{bookmarkChapter}/{bookmarkVerse}" class="!justify-start {cardInnerClasses} w-full flex-col">
									<div class="text-sm">{quranMetaData[bookmarkChapter].transliteration} ({bookmark})</div>

									{#if activeTab === 3 && totalBookmarks !== 0}
										<div class="text-sm truncate direction-rtl text-right arabic-font-1 opacity-70">
											{#await fullQuranData then data}
												{data[`${bookmarkChapter}:${bookmarkVerse}`]}
											{:catch error}
												<p></p>
											{/await}
										</div>
									{/if}
								</a>

								<!-- delete/cross button -->
								<button on:click={() => updateSettings({ type: 'userBookmarks', key: bookmark })} class="pointer h-7 w-7 opacity-100" style="margin-left: -20px; margin-top: -5px;" title="Remove bookmark"><CrossSolid size={7} /></button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- notes tab -->
		<div class="notes-tab-panels space-y-12 {activeTab === 4 ? 'block' : 'hidden'}" id="notes-tab-panel" role="tabpanel" aria-labelledby="notes-tab">
			<div id="notes-cards" class="flex flex-col space-y-4">
				{#if totalNotes === 0}
					<div class="flex items-center justify-center text-sm">You currently do not have any saved notes.</div>
				{:else}
					<div class="{cardGridClasses} grid-cols-1">
						{#each Object.entries($__userNotes) as [verse, note]}
							<a href="{verse.split(':')[0]}/{verse.split(':')[1]}" class="!justify-start {cardInnerClasses} w-full flex-col">
								<div class="text-sm">{quranMetaData[verse.split(':')[0]].transliteration} ({verse})</div>
								<span class="text-xs truncate opacity-70">{note.note}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
