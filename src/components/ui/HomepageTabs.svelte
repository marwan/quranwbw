<script>
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import CrossSolid from '$svgs/CrossSolid.svelte';
	import SortAscending from '$svgs/SortAscending.svelte';
	import SortDescending from '$svgs/SortDescending.svelte';
	import Eye from '$svgs/Eye.svelte';
	import EyeCrossed from '$svgs/EyeCrossed.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import Notes from '$svgs/Notes.svelte';
	import ContinueReading from '$svgs/ContinueReading.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { quranMetaData, juzMeta, mostRead } from '$data/quranMeta';
	import { __lastRead, __favouriteChapters, __userBookmarks, __userNotes, __timeSpecificChapters, __siteNavigationModalVisible, __quranNavigationModalVisible, __homepageExtrasPanelVisible } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { staticEndpoint } from '$data/websiteSettings';
	import { disabledClasses } from '$data/commonClasses';

	const svgData = `<path class="opacity-15" d="M21.77,8.948a1.238,1.238,0,0,1-.7-1.7,3.239,3.239,0,0,0-4.315-4.316,1.239,1.239,0,0,1-1.7-.7,3.239,3.239,0,0,0-6.1,0,1.238,1.238,0,0,1-1.7.7A3.239,3.239,0,0,0,2.934,7.249a1.237,1.237,0,0,1-.7,1.7,3.24,3.24,0,0,0,0,6.1,1.238,1.238,0,0,1,.705,1.7A3.238,3.238,0,0,0,7.25,21.066a1.238,1.238,0,0,1,1.7.7,3.239,3.239,0,0,0,6.1,0,1.238,1.238,0,0,1,1.7-.7,3.239,3.239,0,0,0,4.316-4.315,1.239,1.239,0,0,1,.7-1.7,3.239,3.239,0,0,0,0-6.1Z" />`;
	const continueReadingButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center text-sm ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const cardGridClasses = 'grid md:grid-cols-2 lg:grid-cols-3 gap-3';
	const cardInnerClasses = `flex justify-between md:text-left transition text-sm rounded-xl p-5 hover:cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')} ${window.theme('hover')}`;
	const commontabClasses = 'px-2 md:px-3 py-2 text-xs md:text-md border-b-4 cursor-pointer';
	const tabDefaultBorder = `${commontabClasses} border-transparent`;
	const tabActiveBorder = `${commontabClasses} ${window.theme('border')}`;

	let divisionsActiveTab = 1; // Default to chapters tab
	let extrasActiveTab = 1; // Default to bookmarks
	let divisionsSortIsAscending = true;
	let chapterListOrder = [...quranMetaData];
	let juzListOrder = [...juzMeta];
	let fullQuranData;

	// Fetch full Quran data (uthmani) for bookmarked verses
	$: if (extrasActiveTab === 1 && totalBookmarks > 0) {
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

	$: lastReadExists = $__lastRead.hasOwnProperty('chapter');
	$: totalBookmarks = $__userBookmarks.length;
	$: totalNotes = Object.keys($__userNotes).length;

	// Ensure chapter icons are visible if panel changes
	$: if (divisionsActiveTab) renderChapterIcons();

	// Remove 'invisible' class from chapter icons once fonts are loaded
	document.fonts.ready.then(() => {
		document.querySelectorAll('.chapter-icons').forEach((element) => {
			element.classList.remove('invisible');
		});
	});

	function sortDivisions() {
		divisionsSortIsAscending = !divisionsSortIsAscending;
		chapterListOrder = divisionsSortIsAscending ? [...quranMetaData] : [...quranMetaData].reverse();
		juzListOrder = divisionsSortIsAscending ? [...juzMeta] : [...juzMeta].reverse();

		// Ensure chapter icons are visible after sorting
		renderChapterIcons();
	}

	// Function to remove the invisibility of chapter icons after a short time
	function renderChapterIcons() {
		setTimeout(() => {
			document.querySelectorAll('.chapter-icons').forEach((element) => {
				element.classList.remove('invisible');
			});
		}, 10);
	}
</script>

<div id="homepage-tabs" style="margin-top: 0px;">
	<div class="border-b {window.theme('border')} mt-4"></div>

	<div id="extras-tabs" class="flex items-center justify-between">
		<div class="flex flex-row justify-center">
			<div class="flex text-sm font-medium text-center justify-center space-x-1 md:space-x-4 rounded-full py-2 {!$__homepageExtrasPanelVisible && disabledClasses}">
				<button on:click={() => (extrasActiveTab = 1)} class="{extrasActiveTab === 1 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" data-umami-event="Bookmarks Tab Button">
					<span>Bookmarks</span>
					<span>{totalBookmarks > 0 ? `(${totalBookmarks})` : ''}</span>
				</button>
				<button on:click={() => (extrasActiveTab = 2)} class="{extrasActiveTab === 2 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" data-umami-event="Notes Tab Button">
					<span>Notes</span>
					<span>{totalNotes > 0 ? `(${totalNotes})` : ''}</span>
				</button>
				<button on:click={() => (extrasActiveTab = 3)} class={extrasActiveTab === 3 ? tabActiveBorder : tabDefaultBorder} data-umami-event="Suggestions Tab Button">Suggestions</button>
			</div>
		</div>

		<button
			class="inline-flex p-2 rounded-full items-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}"
			on:click={() => {
				updateSettings({ type: 'homepageExtrasPanelVisible', value: !$__homepageExtrasPanelVisible });
			}}
			data-umami-event="Toggle Panel Button"
		>
			<svelte:component this={$__homepageExtrasPanelVisible ? EyeCrossed : Eye} size={4} />
		</button>
		<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">{$__homepageExtrasPanelVisible ? 'Hide Panel' : 'Show Panel'}</Tooltip>
	</div>

	<div id="extras-panel" class="mb-4 pt-1 {$__homepageExtrasPanelVisible ? 'block' : 'hidden'}">
		<!-- bookmarks tab -->
		<div class="bookmarks-tab-panels space-y-12 {extrasActiveTab === 1 ? 'block' : 'hidden'}" id="bookmarks-tab-panel" role="tabpanel" aria-labelledby="bookmarks-tab">
			<div id="bookmark-cards" class="flex flex-col space-y-4">
				{#if totalBookmarks === 0}
					<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
						<span>You haven't bookmarked any {term('verse')} yet! Start by clicking on the <Bookmark classes="inline mt-[-4px]" /> icon for an {term('verse')}. It's a perfect way to return to the {term('verses')} that resonate with you. </span>
					</div>
				{:else}
					<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
						{#each $__userBookmarks as bookmark}
							{@const [bookmarkChapter, bookmarkVerse] = bookmark.split(':').map(Number)}

							<div class="flex flex-row space-x-2">
								<a href="{bookmarkChapter}?startVerse={bookmarkVerse}" class="!justify-start {cardInnerClasses} w-full flex-col">
									<div class="text-sm truncate max-w-[28vw] md:max-w-[115px]">{quranMetaData[bookmarkChapter].transliteration} ({bookmark})</div>

									{#if extrasActiveTab === 1 && totalBookmarks > 0}
										<div class="text-sm truncate text-right direction-rtl arabic-font-1 opacity-70">
											{#await fullQuranData then data}
												<div class="truncate max-w-[28vw] md:max-w-[115px]">{data[`${bookmarkChapter}:${bookmarkVerse}`]}</div>
											{:catch error}
												<p></p>
											{/await}
										</div>
									{/if}
								</a>

								<!-- delete bookmark button -->
								<button
									on:click={() => {
										const userResponse = confirm(`Are you sure you want to delete this bookmark (${bookmark})?`);
										if (userResponse) {
											updateSettings({ type: 'userBookmarks', key: bookmark });
											window.umami.track('Delete Bookmark Icon');
										}
									}}
									class="pointer h-7 w-7 opacity-100"
									style="margin-left: -20px; margin-top: -5px;"
									title="Delete bookmark"
								>
									<CrossSolid size={7} />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- notes tab -->
		<div class="notes-tab-panels space-y-12 {extrasActiveTab === 2 ? 'block' : 'hidden'}" id="notes-tab-panel" role="tabpanel" aria-labelledby="notes-tab">
			<div id="notes-cards" class="flex flex-col space-y-4">
				{#if totalNotes === 0}
					<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
						<span>You haven't saved any notes yet! Start jotting down your thoughts by clicking the <Notes classes="inline mt-[-4px]" /> icon. It's like creating your own personal treasure chest of wisdom. </span>
					</div>
				{:else}
					<div class="{cardGridClasses} grid-cols-2 md:!grid-cols-4">
						{#each Object.entries($__userNotes) as [verse, note]}
							<a href="{verse.split(':')[0]}?startVerse={verse.split(':')[1]}" class="!justify-start {cardInnerClasses} w-full flex-col">
								<div class="text-sm truncate max-w-[30vw] md:max-w-[115px]">{quranMetaData[verse.split(':')[0]].transliteration} ({verse})</div>
								<span class="text-xs truncate opacity-70">{note.note}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- suggestions tab -->
		<div class="space-y-12 {extrasActiveTab === 3 ? 'block' : 'hidden'}" id="suggestions-tab-panel" role="tabpanel" aria-labelledby="suggestions-tab">
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
	</div>

	<div class="border-b {window.theme('border')}"></div>

	<div id="quran-division-tabs" class="mt-4">
		<div class="flex flex-row items-center justify-between">
			<div class="flex text-sm font-medium text-center justify-center space-x-1 md:space-x-4 rounded-full py-2">
				<button on:click={() => (divisionsActiveTab = 1)} class="{divisionsActiveTab === 1 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" data-umami-event="Chapters Tab Button">
					<span>{term('chapters')}</span>
				</button>
				<button on:click={() => (divisionsActiveTab = 2)} class="{divisionsActiveTab === 2 ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" data-umami-event="Juz Tab Button">
					<span>{term('juzs')}</span>
				</button>
			</div>

			<button class="inline-flex p-2 rounded-full items-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" on:click={() => sortDivisions()} data-umami-event="Homepage Divisions Sort Button">
				<svelte:component this={divisionsSortIsAscending ? SortDescending : SortAscending} size={4} />
			</button>
			<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">{divisionsSortIsAscending ? 'Sort Descending' : 'Sort Ascending'}</Tooltip>
		</div>
	</div>

	<div id="quran-divisions-panel" class="mb-6">
		<!-- chapters tab -->
		{#if divisionsActiveTab === 1}
			<div id="chapters-tab-panel" role="tabpanel" aria-labelledby="chapters-tab">
				<!-- continue readin button -->
				{#if lastReadExists}
					{@const lastReadChapter = $__lastRead.chapter}
					{@const lastReadVerse = $__lastRead.verse}
					<a href="/{lastReadChapter}?startVerse={lastReadVerse}" class="{continueReadingButtonClasses} mb-2 truncate w-full" on:click={() => window.umami.track('Continue Chapter Button')}>
						<span class="invisible chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
						<span class="truncate">
							Continue Reading:
							{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}
						</span>
					</a>
				{/if}

				<div class="{cardGridClasses} grid-cols-1">
					{#each chapterListOrder as { id }, i}
						{#if id > 0}
							<a href="/{id}">
								<div class="{cardInnerClasses} flex-row text-center items-center">
									<div class="flex flex-row space-x-2">
										<div class="flex items-center">
											<!-- number star -->
											<svg class="w-10 h-10 rounded-full flex items-center justify-center" fill={window.theme('icon')} viewBox="0 0 24 24">
												{@html svgData}
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
		{/if}

		<!-- juz tab -->
		{#if divisionsActiveTab === 2}
			<div id="juz-tab-panel" role="tabpanel" aria-labelledby="juz-tab">
				{#if lastReadExists}
					{@const lastReadChapter = $__lastRead.chapter}
					{@const lastReadVerse = $__lastRead.verse}
					{@const lastReadJuz = $__lastRead.juz}
					<a href="/juz/{lastReadJuz}?startKey={lastReadChapter}:{lastReadVerse}" class="{continueReadingButtonClasses} mb-2 truncate w-full" on:click={() => window.umami.track('Continue Juz Button')}>
						<span class="invisible chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
						<span>
							Continue Reading: {term('juz')}
							{lastReadJuz}, {lastReadChapter}:{lastReadVerse}
						</span>
					</a>
				{/if}

				<div class="{cardGridClasses} grid-cols-1">
					{#each juzListOrder as juz}
						<a href="/juz/{juz.juz}">
							<div class="{cardInnerClasses} flex-row text-center items-center">
								<div class="flex flex-row space-x-2">
									<div class="flex items-center">
										<!-- number star -->
										<svg class="w-10 h-10 rounded-full flex items-center justify-center" fill={window.theme('icon')} viewBox="0 0 24 24">
											{@html svgData}
											<text x="50%" y="53%" text-anchor="middle" stroke={window.theme('icon')} stroke-width="0.5px" dy=".3em" class="text" style="font-size: 7px;">{juz.juz}</text>
										</svg>
									</div>

									<div class="text-left">
										<div class="flex flex-row items-center space-x-1 justify-start truncate">
											<div>{juz.name}</div>
										</div>

										<div class="block text-xs truncate opacity-70">
											{juz.from} - {juz.to}
										</div>
									</div>
								</div>

								<div class="juz-icons justify-items-end text-xl md:text-2xl" style="color: {window.theme('icon')}">{juz.icon}</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
