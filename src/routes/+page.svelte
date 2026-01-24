<script>
	import PageHead from '$misc/PageHead.svelte';
	import Quran from '$svgs/Quran.svelte';
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import SortAscending from '$svgs/SortAscending.svelte';
	import SortDescending from '$svgs/SortDescending.svelte';
	import Eye from '$svgs/Eye.svelte';
	import EyeCrossed from '$svgs/EyeCrossed.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import Menu from '$svgs/Menu.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';
	import Search2Bold from '$svgs/Search2Bold.svelte';
	import Info from '$svgs/Info.svelte';
	import UserBookmarks from '$display/UserBookmarks.svelte';
	import UserNotes from '$display/UserNotes.svelte';
	import { websiteTagline } from '$data/websiteSettings';
	import { __currentPage, __lastRead, __siteNavigationModalVisible, __quranNavigationModalVisible, __userBookmarks, __userNotes, __homepageExtrasPanelVisible, __wideWesbiteLayoutEnabled } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { quranMetaData, juzMeta, mostRead } from '$data/quranMeta';
	import { term } from '$utils/terminologies';
	import { disabledClasses } from '$data/commonClasses';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';

	const svgData = `<path class="opacity-15" d="M21.77,8.948a1.238,1.238,0,0,1-.7-1.7,3.239,3.239,0,0,0-4.315-4.316,1.239,1.239,0,0,1-1.7-.7,3.239,3.239,0,0,0-6.1,0,1.238,1.238,0,0,1-1.7.7A3.239,3.239,0,0,0,2.934,7.249a1.237,1.237,0,0,1-.7,1.7,3.24,3.24,0,0,0,0,6.1,1.238,1.238,0,0,1,.705,1.7A3.238,3.238,0,0,0,7.25,21.066a1.238,1.238,0,0,1,1.7.7,3.239,3.239,0,0,0,6.1,0,1.238,1.238,0,0,1,1.7-.7,3.239,3.239,0,0,0,4.316-4.315,1.239,1.239,0,0,1,.7-1.7,3.239,3.239,0,0,0,0-6.1Z" />`;
	const topButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const continueReadingButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center text-sm ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const cardGridClasses = 'grid md:grid-cols-2 lg:grid-cols-3 gap-3';
	const cardInnerClasses = `flex justify-between md:text-left transition text-sm rounded-xl p-5 hover:cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')} ${window.theme('hover')}`;
	const commontabClasses = 'px-2 md:px-3 py-2 text-xs md:text-md border-b-4 cursor-pointer';
	const tabDefaultBorder = `${commontabClasses} border-transparent`;
	const tabActiveBorder = `${commontabClasses} ${window.theme('border')}`;
	const siteDescriptionText = ['Your companion for reading, listening to, and learning the Holy Quran, word by word.', 'With features like word audios, Tajweed colors, and transliteration, delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.'];
	const currentHour = new Date().getHours();

	let divisionsActiveTab = 1; // Default to chapters tab
	let extrasActiveTab = 1; // Default to bookmarks
	let divisionsSortIsAscending = true;
	let chapterListOrder = [...quranMetaData];
	let juzListOrder = [...juzMeta];

	$: isFriday = new Date().getDay() === 5 && currentHour < 18;
	$: isNight = currentHour < 4 || currentHour > 18;
	$: lastReadExists = Object.prototype.hasOwnProperty.call($__lastRead, 'chapter');
	$: totalBookmarks = $__userBookmarks.length;
	$: totalNotes = Object.keys($__userNotes).length;

	function sortDivisions() {
		divisionsSortIsAscending = !divisionsSortIsAscending;
		chapterListOrder = divisionsSortIsAscending ? [...quranMetaData] : [...quranMetaData].reverse();
		juzListOrder = divisionsSortIsAscending ? [...juzMeta] : [...juzMeta].reverse();
	}

	let chapterDataLoaded = false;

	// On first scroll (after 50px), fetch chapter and translation data without updating the store
	window.addEventListener('scroll', async function onScroll() {
		if (!chapterDataLoaded && window.scrollY > 50) {
			chapterDataLoaded = true;
			fetchChapterData({ chapter: 1, preventStoreUpdate: true });
			fetchVerseTranslationData({ preventStoreUpdate: true });
			window.removeEventListener('scroll', onScroll);
		}
	});

	__currentPage.set('home');
</script>

<PageHead title={`Quran ${websiteTagline}`} />

<div class={`${!$__wideWesbiteLayoutEnabled && 'max-w-5xl'} mx-auto flex flex-col space-y-4 md:px-4`}>
	<!-- top menu -->
	<div class="flex flex-col mt-2">
		<div class="w-full flex flex-row justify-between text-sm">
			<div>
				<button class="{topButtonClasses} !py-4 md:bg-transparent" on:click={() => __quranNavigationModalVisible.set(true)}><Search2Bold size={4} /><span class="hidden md:block">Search</span></button>
				<a href={`/${term('supplications').toLowerCase()}`} class="{topButtonClasses} !py-4 md:bg-transparent"><SupplicationBold size={4} /><span class="hidden md:block">{term('supplications')}</span></a>
				<a href={Object.prototype.hasOwnProperty.call($__lastRead, 'page') ? `/page/${$__lastRead.page}` : '/page/1'} class="{topButtonClasses} !py-4 md:bg-transparent"><BookFilled size={4} /><span class="hidden md:block">Mushaf</span></a>
				<a href="/morphology?word=1:1" class="{topButtonClasses} !py-4 md:bg-transparent"><MorphologyBold size={4} /><span class="hidden md:block">Morphology</span></a>
				<a href="/offline" class="{topButtonClasses} !py-4 md:bg-transparent"><Info size={4} /><span class="hidden md:block">Offline</span></a>
			</div>
			<button class="{topButtonClasses} !py-4 md:bg-transparent" on:click={() => __siteNavigationModalVisible.set(true)}><Menu size={4} /><span class="hidden md:block">Menu</span></button>
		</div>
	</div>

	<!-- mid section -->
	<div class="flex flex-col mb-4 py-8 px-6 md:px-8 rounded-xl !mt-2 {window.theme('bgSecondaryLight')} homepage-background-image">
		<a href="/" class="flex flex-row space-x-4 px-2 items-center justify-left" aria-label="Home">
			<div><Quran /></div>

			<div class="flex flex-col">
				<div id="site-title" class="text-2xl md:text-3xl font-bold pb-2" style="color: {window.theme('icon')}">
					<span class="block md:hidden">QuranWBW</span>
					<span class="hidden md:block">Quran Word By Word</span>
				</div>

				<div id="site-description" class="text-sm opacity-70">
					<div class="block md:hidden">{siteDescriptionText[0]}</div>
					<div class="hidden md:block">{siteDescriptionText[0]} {siteDescriptionText[1]}</div>
				</div>
			</div>
		</a>
	</div>

	<!-- extras: continue reading, time specific chapters -->
	{#if isFriday || isNight}
		<div class="flex flex-col mt-4 text-sm">
			<div class="w-full flex flex-row space-x-4 items-center">
				<div class="flex flex-row space-x-2 w-full">
					{#if isFriday}
						<a href="/18" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Kahf Reminder Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[18].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Friday Reminder:</span>
								<span>Al Kahf</span>
							</div>
						</a>
					{/if}

					{#if isNight}
						<a href="/56" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Waaqia Reminder Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[56].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Evening Reminder:</span>
								<span>Al Waaqia</span>
							</div>
						</a>

						<a href="/67" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Mulk Reminder Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[67].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Night Reminder:</span>
								<span>Al Mulk</span>
							</div>
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- chapter and most read tabs -->
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
				<UserBookmarks {cardGridClasses} {cardInnerClasses} />
			</div>

			<!-- notes tab -->
			<div class="notes-tab-panels space-y-12 {extrasActiveTab === 2 ? 'block' : 'hidden'}" id="notes-tab-panel" role="tabpanel" aria-labelledby="notes-tab">
				<UserNotes {cardGridClasses} {cardInnerClasses} />
			</div>

			<!-- suggestions tab -->
			<div class="space-y-12 {extrasActiveTab === 3 ? 'block' : 'hidden'}" id="suggestions-tab-panel" role="tabpanel" aria-labelledby="suggestions-tab">
				<div id="suggestions-chapters" class="flex flex-col space-y-4">
					<div class="{cardGridClasses} grid-cols-1">
						{#each Object.entries(mostRead) as [_, item]}
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
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
							<span class="truncate">
								Continue Reading:
								{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}
							</span>
						</a>
					{/if}

					<div class="{cardGridClasses} grid-cols-1">
						{#each chapterListOrder as { id }, _}
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

										<div class="chapter-icons justify-items-end text-5xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[id].icon};`}</div>
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
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
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
</div>
