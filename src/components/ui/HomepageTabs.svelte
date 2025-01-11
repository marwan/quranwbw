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

	let lastReadChapter = 1;
	let lastReadVerse = 1;
	let activeTab = 1; // Default to chapters tab
	let chapterSortIsAscending = true;
	let chapterListOrder = [...quranMetaData];
	let fullQuranData;

	// Reactive variable to update last read chapter and verse
	$: if ($__lastRead.hasOwnProperty('key')) {
		[lastReadChapter, lastReadVerse] = $__lastRead.key.split(':').map(Number);
	}

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
												d="M22.94,12.388c.084-.156,.078-.344-.011-.493-.157-.278-.997-1.664-2.753-2.908,.641-2.543,.067-4.374,.041-4.454-.055-.168-.193-.294-.362-.333-.344-.089-2.099-.479-4.417,.068-1.41-2.182-3.13-3.104-3.206-3.143-.148-.078-.322-.076-.467,0-.337,.169-2,1.079-3.299,3.12-2.262-.511-3.97-.136-4.322-.047-.169,.04-.309,.165-.363,.333-.024,.075-.564,1.793-.017,4.213-1.891,1.237-2.671,2.66-2.706,2.723-.084,.156-.078,.343,.011,.493,.158,.281,.735,1.218,1.877,2.218-.954,2.21-.769,3.942-.76,4.019,.021,.176,.132,.327,.292,.398,.28,.134,1.694,.761,3.757,.804,.231,2.027,1.002,3.246,1.038,3.301,.096,.149,.256,.25,.437,.229,.355-.003,2.174-.081,4.289-1.221,2.37,1.266,4.299,1.221,4.305,1.221,.168,0,.327-.085,.42-.229,.035-.055,.809-1.274,1.039-3.301,2.055-.043,3.464-.664,3.758-.805,.158-.071,.271-.222,.291-.398,.008-.071,.181-1.679-.657-3.771,1.232-1.03,1.762-1.997,1.785-2.041Zm-2.697,1.491c-.184,.141-.246,.389-.152,.6,.674,1.51,.746,2.788,.74,3.33-.547,.22-1.782,.634-3.514,.593h-.011c-.263,0-.481,.204-.499,.467-.101,1.513-.56,2.593-.791,3.05-.637-.047-2.105-.261-3.768-1.214-.153-.089-.344-.089-.497,0-1.663,.953-3.132,1.167-3.769,1.214-.231-.458-.689-1.537-.79-3.05-.018-.263-.236-.467-.499-.467h-.011c-1.717,.043-2.966-.374-3.513-.594-.006-.567,.074-1.944,.841-3.55,.1-.208,.043-.458-.136-.603-.958-.78-1.529-1.551-1.787-1.945,.305-.447,1.094-1.452,2.507-2.304,.19-.115,.282-.341,.225-.556-.468-1.771-.272-3.176-.153-3.741,.621-.118,2.076-.287,3.908,.194,.219,.055,.446-.038,.559-.232,1-1.713,2.293-2.602,2.854-2.928,.503,.323,1.769,1.249,2.79,2.956,.115,.193,.349,.283,.56,.226,1.876-.508,3.361-.336,3.994-.217,.124,.587,.331,2.082-.211,3.952-.061,.21,.022,.436,.205,.557,1.45,.956,2.26,2.031,2.586,2.531-.238,.35-.773,1.042-1.669,1.732Z"
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
