<script>
	import PageHead from '$misc/PageHead.svelte';
	import Quran from '$svgs/Quran.svelte';
	import SortAscending from '$svgs/SortAscending.svelte';
	import SortDescending from '$svgs/SortDescending.svelte';
	import Eye from '$svgs/Eye.svelte';
	import EyeCrossed from '$svgs/EyeCrossed.svelte';
	import StarFilled from '$svgs/StarFilled.svelte';
	import Star from '$svgs/Star.svelte';
	import Menu from '$svgs/Menu.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import TopicsBold from '$svgs/TopicsBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';
	import Search2Bold from '$svgs/Search2Bold.svelte';
	import Edit2 from '$svgs/Edit2.svelte';
	import UserBookmarks from '$display/UserBookmarks.svelte';
	import UserNotes from '$display/UserNotes.svelte';
	import QuranDivisionCard from '$display/QuranDivisionCard.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { websiteTagline } from '$data/websiteSettings';
	import { __currentPage, __lastRead, __siteNavigationModalVisible, __quranNavigationModalVisible, __userBookmarks, __userNotes, __wideWesbiteLayoutEnabled, __homepageLayoutPreferences, __userFavoriteChapters, __favoriteChaptersModalVisible } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { quranMetaData, juzMeta, hizbMeta, mostRead } from '$data/quranMeta';
	import { term } from '$utils/terminologies';
	import { disabledClasses } from '$data/commonClasses';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';

	const topButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const continueReadingButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center text-sm ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const cardGridClasses = 'grid md:grid-cols-2 lg:grid-cols-3 gap-3';
	const cardInnerClasses = `flex justify-between md:text-left transition text-sm rounded-xl p-5 hover:cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')} ${window.theme('hover')}`;
	const commontabClasses = 'px-2 md:px-3 py-2 text-xs md:text-md border-b-4 cursor-pointer';
	const tabDefaultBorder = `${commontabClasses} border-transparent`;
	const tabActiveBorder = `${commontabClasses} ${window.theme('border')}`;
	const siteDescriptionText = ['Your companion for reading, listening to, and learning the Holy Quran, word by word.', 'With features like word audios, Tajweed colors, and transliteration, delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.'];
	const currentHour = new Date().getHours();

	// Tab Indexes
	const bookmarksTab = 1;
	const notesTab = 2;
	const suggestionsTab = 3;
	const chaptersTab = 1;
	const juzTab = 2;
	const favoriteChaptersTab = 3;
	const hizbTab = 4;

	let chapterListOrder = [];
	let juzListOrder = [];
	let hizbListOrder = [];
	let homepageLayoutPreferences = $__homepageLayoutPreferences;

	$: divisionsActiveTab = homepageLayoutPreferences?.divisionsActiveTab ?? 1;
	$: extrasActiveTab = homepageLayoutPreferences?.extrasActiveTab ?? 1;
	$: showDivisionSort = [chaptersTab, juzTab, favoriteChaptersTab, hizbTab].includes(divisionsActiveTab);
	$: isFriday = new Date().getDay() === 5 && currentHour < 18;
	$: isNight = currentHour < 4 || currentHour > 18;
	$: lastReadExists = Object.prototype.hasOwnProperty.call($__lastRead, 'chapter');
	$: totalBookmarks = $__userBookmarks.length;
	$: totalNotes = Object.keys($__userNotes).length;
	$: hasFavorites = $__userFavoriteChapters.length > 0;
	$: favoritesSortIsAscending = homepageLayoutPreferences.favoritesSortIsAscending ?? true;
	$: sortedFavoriteChapters = favoritesSortIsAscending ? [...$__userFavoriteChapters].sort((a, b) => a - b) : [...$__userFavoriteChapters].sort((a, b) => b - a);

	// Derives the sort state for whichever division tab is currently active
	$: currentSortIsAscending =
		divisionsActiveTab === chaptersTab // chapters
			? homepageLayoutPreferences.chaptersSortIsAscending
			: divisionsActiveTab === juzTab // juz
				? homepageLayoutPreferences.juzSortIsAscending
				: divisionsActiveTab === favoriteChaptersTab // favorites
					? homepageLayoutPreferences.favoritesSortIsAscending
					: homepageLayoutPreferences.hizbSortIsAscending; // hizb

	// Persist homepage layout preferences whenever they change
	$: if (homepageLayoutPreferences) updateSettings({ type: 'homepageLayoutPreferences', value: homepageLayoutPreferences });

	// Initialize chapter, juz, and hizb list order based on saved sort preference
	$: {
		const chaptersAscending = homepageLayoutPreferences?.chaptersSortIsAscending ?? true;
		const juzAscending = homepageLayoutPreferences?.juzSortIsAscending ?? true;
		const hizbAscending = homepageLayoutPreferences?.hizbSortIsAscending ?? true;

		chapterListOrder = chaptersAscending ? [...quranMetaData] : [...quranMetaData].reverse();
		juzListOrder = juzAscending ? [...juzMeta] : [...juzMeta].reverse();
		hizbListOrder = hizbAscending ? [...hizbMeta] : [...hizbMeta].reverse();
	}

	// Toggles sort order for the active division tab
	function sortDivisions() {
		const divisionConfig = {
			1: {
				key: 'chaptersSortIsAscending',
				data: quranMetaData,
				set: (sorted) => (chapterListOrder = sorted)
			},
			2: {
				key: 'juzSortIsAscending',
				data: juzMeta,
				set: (sorted) => (juzListOrder = sorted)
			},
			3: {
				key: 'favoritesSortIsAscending',
				set: () => {}
			},
			4: {
				key: 'hizbSortIsAscending',
				data: hizbMeta,
				set: (sorted) => (hizbListOrder = sorted)
			}
		};
		const { key, data, set } = divisionConfig[divisionsActiveTab];
		const newValue = !homepageLayoutPreferences[key];
		homepageLayoutPreferences = { ...homepageLayoutPreferences, [key]: newValue };
		if (data) set(newValue ? [...data] : [...data].reverse());
	}

	// Updates the active tab and triggers reactivity by replacing the preferences object
	function changeTabs(tabName, tabNumber) {
		homepageLayoutPreferences = {
			...homepageLayoutPreferences,
			[tabName]: tabNumber
		};
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
				<button
					class="{topButtonClasses} !py-4 md:bg-transparent"
					on:click={() => {
						window.umami?.track('Homepage Search Button');
						__quranNavigationModalVisible.set(true);
					}}
				>
					<Search2Bold size={4} />
					<span class="hidden md:block">Search</span>
				</button>
				<a href="/topics" class="{topButtonClasses} !py-4 md:bg-transparent"><TopicsBold size={4} /><span class="hidden md:block">Topics</span></a>
				<a href={`/${term('supplications').toLowerCase()}`} class="{topButtonClasses} !py-4 md:bg-transparent"><SupplicationBold size={4} /><span class="hidden md:block">{term('supplications')}</span></a>
				<a href={Object.prototype.hasOwnProperty.call($__lastRead, 'page') ? `/page?id=${$__lastRead.page}` : '/page?id=1'} class="{topButtonClasses} !py-4 md:bg-transparent"><BookFilled size={4} /><span class="hidden md:block">Mushaf</span></a>
				<a href="/morphology?word=1:1" class="{topButtonClasses} !py-4 md:bg-transparent"><MorphologyBold size={4} /><span class="hidden md:block">Morphology</span></a>
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
				<div class="flex text-sm font-medium text-center justify-center space-x-1 md:space-x-4 rounded-full py-2 {!homepageLayoutPreferences.extrasPanelVisible && disabledClasses}">
					<button on:click={() => changeTabs('extrasActiveTab', bookmarksTab)} class="{extrasActiveTab === bookmarksTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" data-umami-event="Bookmarks Tab Button">
						<span>Bookmarks</span>
						<span>{totalBookmarks > 0 ? `(${totalBookmarks})` : ''}</span>
					</button>
					<button on:click={() => changeTabs('extrasActiveTab', notesTab)} class="{extrasActiveTab === notesTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center truncate" data-umami-event="Notes Tab Button">
						<span>Notes</span>
						<span>{totalNotes > 0 ? `(${totalNotes})` : ''}</span>
					</button>
					<button on:click={() => changeTabs('extrasActiveTab', suggestionsTab)} class={extrasActiveTab === suggestionsTab ? tabActiveBorder : tabDefaultBorder} data-umami-event="Suggestions Tab Button">Suggestions</button>
				</div>
			</div>

			<button class="inline-flex p-2 rounded-full items-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" on:click={() => (homepageLayoutPreferences.extrasPanelVisible = !homepageLayoutPreferences.extrasPanelVisible)} data-umami-event="Toggle Panel Button">
				<svelte:component this={homepageLayoutPreferences.extrasPanelVisible ? EyeCrossed : Eye} size={4} />
			</button>
			<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">{homepageLayoutPreferences.extrasPanelVisible ? 'Hide Panel' : 'Show Panel'}</Tooltip>
		</div>

		<div id="extras-panel" class="mb-4 pt-2 {homepageLayoutPreferences.extrasPanelVisible ? 'block' : 'hidden'}">
			<!-- bookmarks tab -->
			<div class="bookmarks-tab-panels space-y-12 {extrasActiveTab === bookmarksTab ? 'block' : 'hidden'}" id="bookmarks-tab-panel" role="tabpanel" aria-labelledby="bookmarks-tab">
				<UserBookmarks {cardGridClasses} {cardInnerClasses} />
			</div>

			<!-- notes tab -->
			<div class="notes-tab-panels space-y-12 {extrasActiveTab === notesTab ? 'block' : 'hidden'}" id="notes-tab-panel" role="tabpanel" aria-labelledby="notes-tab">
				<UserNotes {cardGridClasses} {cardInnerClasses} />
			</div>

			<!-- suggestions tab -->
			<div class="space-y-12 {extrasActiveTab === suggestionsTab ? 'block' : 'hidden'}" id="suggestions-tab-panel" role="tabpanel" aria-labelledby="suggestions-tab">
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
					<button id="favorite-chapters-tab" on:click={() => changeTabs('divisionsActiveTab', favoriteChaptersTab)} class="{divisionsActiveTab === favoriteChaptersTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-1 items-center" data-umami-event="Favorite Chapters Tab Button" aria-label={`Favorite ${term('chapters')}`} title={`Favorite ${term('chapters')}`}>
						<svelte:component this={divisionsActiveTab === favoriteChaptersTab ? StarFilled : Star} size={4} />
					</button>
					<button on:click={() => changeTabs('divisionsActiveTab', chaptersTab)} class="{divisionsActiveTab === chaptersTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" data-umami-event="Chapters Tab Button">
						<span>{term('chapters')}</span>
					</button>
					<button on:click={() => changeTabs('divisionsActiveTab', juzTab)} class="{divisionsActiveTab === juzTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" data-umami-event="Juz Tab Button">
						<span>{term('juzs')}</span>
					</button>
					<button on:click={() => changeTabs('divisionsActiveTab', hizbTab)} class="{divisionsActiveTab === hizbTab ? tabActiveBorder : tabDefaultBorder} flex flex-row space-x-2 items-center" data-umami-event="Hizb Tab Button">
						<span>{term('hizbs')}</span>
					</button>
				</div>

				{#if showDivisionSort}
					<button class="inline-flex p-2 rounded-full items-center {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" on:click={() => sortDivisions()} data-umami-event="Homepage Divisions Sort Button">
						<svelte:component this={currentSortIsAscending ? SortDescending : SortAscending} size={4} />
					</button>
					<Tooltip arrow={false} type="light" placement="top" class="z-30 w-max hidden md:block font-normal">
						{currentSortIsAscending ? 'Sort Descending' : 'Sort Ascending'}
					</Tooltip>
				{/if}
			</div>
		</div>

		<div id="quran-divisions-panel" class="mb-6 pt-2">
			<!-- chapters tab -->
			{#if divisionsActiveTab === chaptersTab}
				<div id="chapters-tab-panel" role="tabpanel" aria-labelledby="chapters-tab">
					<!-- continue readin button -->
					{#if lastReadExists}
						{@const lastReadChapter = $__lastRead.chapter}
						{@const lastReadVerse = $__lastRead.verse}
						<a href="/{lastReadChapter}?startVerse={lastReadVerse}" class="{continueReadingButtonClasses} mb-2 truncate w-full" on:click={() => window.umami.track('Continue Chapter Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
							<span class="truncate">
								<span class="md:hidden">Continue:</span>
								<span class="hidden md:inline-block">Continue Reading:</span>
								{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}
							</span>
						</a>
					{/if}

					<div class="{cardGridClasses} grid-cols-1">
						{#each chapterListOrder as { id }, _}
							{#if id > 0}
								<QuranDivisionCard type="chapter" {id} {cardInnerClasses} />
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- juz tab -->
			{#if divisionsActiveTab === juzTab}
				<div id="juz-tab-panel" role="tabpanel" aria-labelledby="juz-tab">
					{#if lastReadExists}
						{@const lastReadChapter = $__lastRead.chapter}
						{@const lastReadVerse = $__lastRead.verse}
						{@const lastReadJuz = $__lastRead.juz}
						<a href="/juz?id={lastReadJuz}&startKey={lastReadChapter}:{lastReadVerse}" class="{continueReadingButtonClasses} mb-2 truncate w-full" on:click={() => window.umami.track('Continue Juz Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
							<span>
								Continue Reading: {term('juz')}
								{lastReadJuz}, {lastReadChapter}:{lastReadVerse}
							</span>
						</a>
					{/if}

					<div class="{cardGridClasses} grid-cols-1">
						{#each juzListOrder as juz}
							<QuranDivisionCard type="juz" {juz} {cardInnerClasses} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- favorites tab -->
			{#if divisionsActiveTab === favoriteChaptersTab}
				<div id="favorites-tab-panel" role="tabpanel" aria-labelledby="favorite-chapters-tab">
					<div class="flex flex-row space-x-2 text-sm mb-2">
						<!-- Edit Favorites button  -->
						<button class="{topButtonClasses} truncate w-full min-h-[54px] md:min-h-[58px]" on:click={() => __favoriteChaptersModalVisible.set(true)}>
							<Edit2 size={4} />
							<span>{hasFavorites ? 'Manage' : 'Add Your'} Favorite {term('chapters')}</span>
						</button>
					</div>

					<div class="{cardGridClasses} grid-cols-1">
						{#each sortedFavoriteChapters as id (id)}
							<QuranDivisionCard type="chapter" {id} {cardInnerClasses} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- hizb tab -->
			{#if divisionsActiveTab === hizbTab}
				<div id="hizb-tab-panel" role="tabpanel" aria-labelledby="hizb-tab">
					{#if lastReadExists && $__lastRead.hizb}
						{@const lastReadChapter = $__lastRead.chapter}
						{@const lastReadVerse = $__lastRead.verse}
						{@const lastReadHizb = $__lastRead.hizb}
						<a href="/hizb/{lastReadHizb}?startKey={lastReadChapter}:{lastReadVerse}" class="{continueReadingButtonClasses} mb-2 truncate w-full" on:click={() => window.umami.track('Continue Hizb Button')}>
							<span class="chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[lastReadChapter].icon};`}</span>
							<span>
								Continue Reading: {term('hizb')}
								{lastReadHizb}, {lastReadChapter}:{lastReadVerse}
							</span>
						</a>
					{/if}

					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each hizbListOrder as hizb}
							<QuranDivisionCard type="hizb" {hizb} {cardInnerClasses} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
