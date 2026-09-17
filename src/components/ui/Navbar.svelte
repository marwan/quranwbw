<script>
	import Menu from '$svgs/Menu.svelte';
	import Home from '$svgs/Home.svelte';
	import ChevronDown from '$svgs/ChevronDown.svelte';
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __chapterNumber, __currentPage, __lastRead, __topNavbarVisible, __pageNumber, __morphologyKey, __mushafPageDivisions, __siteNavigationModalVisible, __quranNavigationModalVisible, __wideWesbiteLayoutEnabled, __fullVersesDisplayKeys, __chapterData, __verseKeyData } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getWebsiteWidth } from '$utils/getWebsiteWidth';
	import { page } from '$app/stores';

	let lastReadPage;
	let lastReadJuz;
	let navbarChapterName;
	let mushafChapters = [];
	let mushafJuz = '...';
	let mushafChapterInfo = [];

	// Classes for the navbar
	$: navbarClasses = `bg-theme-bg border-b border-theme-accent/20 fixed w-full z-20 top-0 left-0 print:hidden ${$__currentPage === 'home' ? 'hidden' : 'block'}`;
	$: topNavClasses = `
		${getWebsiteWidth($__wideWesbiteLayoutEnabled)}
		${$__topNavbarVisible ? 'block' : 'hidden'} 
		${['chapter', 'mushaf'].includes($__currentPage) && `border-b border-theme-accent/20 `}
		flex flex-row items-center justify-between mx-auto px-4 py-2
	`;

	// Update last read details
	$: try {
		const lastReadElement = document.getElementById(`${$__lastRead.chapter}:${$__lastRead.verse}`);
		lastReadPage = lastReadElement?.getAttribute('data-page');
		lastReadJuz = lastReadElement?.getAttribute('data-juz');
	} catch (error) {
		console.warn(error);
	}

	// Get the revelation type of the current chapter
	$: chapterRevelation = quranMetaData[$__chapterNumber].revelation;

	let RevelationIcon;
	$: revelation = chapterRevelation === 1 ? { termKey: 'meccan', Icon: Mecca } : { termKey: 'medinan', Icon: Madinah };
	$: revelationTerm = term(revelation.termKey);
	$: RevelationIcon = revelation.Icon;

	// cumulativeWords[verse] = number of words from the start of the chapter to that verse.
	$: chapterWordCounts = (() => {
		if ($__currentPage !== 'chapter' || !$__chapterData) return null;

		const cumulativeWords = [0];
		let total = 0;

		for (let verse = 1; verse <= quranMetaData[$__chapterNumber].verses; verse++) {
			total += $__chapterData[`${$__chapterNumber}:${verse}`]?.meta.words ?? 0;
			cumulativeWords[verse] = total;
		}

		return { cumulativeWords, total };
	})();

	$: readingProgress = (() => {
		// No progress if the user hasn't started reading yet
		if (!Object.prototype.hasOwnProperty.call($__lastRead, 'chapter')) return 0;

		// progress = words read / total words in chapter
		if ($__currentPage === 'chapter') {
			if ($__lastRead.chapter !== $__chapterNumber || !chapterWordCounts?.total) return 0;

			return ((chapterWordCounts.cumulativeWords[$__lastRead.verse] ?? 0) / chapterWordCounts.total) * 100;
		}

		if ($__fullVersesDisplayKeys?.length) {
			// The store may hold a comma-separated string or an array — normalise to array
			const verseKeys = typeof $__fullVersesDisplayKeys === 'string' ? $__fullVersesDisplayKeys.split(',') : $__fullVersesDisplayKeys;

			// A juz or hizb spans several chapters, so positions have to be compared across them.
			// Multiply the chapter number by 1000 to ensure that the verse number doesn't affect the comparison.
			const positionOf = (chapter, verse) => chapter * 1000 + verse;
			const keyPosition = (verseKey) => positionOf(...verseKey.split(':').map(Number));

			const lastReadPosition = positionOf($__lastRead.chapter, $__lastRead.verse);
			if (lastReadPosition < keyPosition(verseKeys[0]) || lastReadPosition > keyPosition(verseKeys[verseKeys.length - 1])) return 0;

			// Find the last key at or before the read position — it marks where to stop counting words
			const index = verseKeys.findLastIndex((verseKey) => keyPosition(verseKey) <= lastReadPosition);

			// If no key is before the last read position, the user hasn't reached this page yet
			if (index === -1) return 0;

			// Progress = words up to the last read key / total words on this page
			if ($__verseKeyData) {
				let readWords = 0;
				let totalWords = 0;

				verseKeys.forEach((verseKey, keyIndex) => {
					const words = $__verseKeyData[verseKey]?.words ?? 0;
					totalWords += words;
					if (keyIndex <= index) readWords += words;
				});

				if (totalWords > 0) return (readWords / totalWords) * 100;
			}

			// Fall back to the key position while the word counts are still loading
			return ((index + 1) / verseKeys.length) * 100;
		}

		return 0;
	})();

	// Get the chapter name for the navbar, prefixed with the chapter number
	$: {
		navbarChapterName = `${$__chapterNumber} - ${quranMetaData[$__chapterNumber].transliteration}`;

		// Only show the translation if it's different from the transliteration
		if (quranMetaData[$__chapterNumber].transliteration !== quranMetaData[$__chapterNumber].translation) {
			navbarChapterName += `<span class="hidden md:inline-block">&nbsp;(${quranMetaData[$__chapterNumber].translation})</span>`;
		}
	}

	// Update chapter names for the mushaf page
	$: if ($__mushafPageDivisions?.juz && $__mushafPageDivisions?.chapters) {
		try {
			mushafJuz = `${term('juz')} ${$__mushafPageDivisions.juz}`;
			mushafChapters = Object.values($__mushafPageDivisions.chapters).map((value) => quranMetaData[value].transliteration);
			mushafChapterInfo = Object.values($__mushafPageDivisions.chapters).map((chapter) => ({
				name: quranMetaData[chapter].transliteration,
				Icon: quranMetaData[chapter].revelation === 1 ? Mecca : Madinah
			}));
		} catch (error) {
			console.warn(error);
		}
	}

	// Set the Juz or Hizb Id
	$: juzOrHizbId = Number($page.url.searchParams.get('id')) || 1;
</script>

<nav id="navbar" class={navbarClasses}>
	<div id="top-nav" class={topNavClasses} aria-label="Home">
		<a href="/" class="flex flex-row items-center p-3 cursor-pointer rounded-3xl border border-transparent hover:border-theme-accent bg-theme-accent/5" aria-label="Home">
			<Home />
			<span class="text-xs pl-2 hidden md:block">Home</span>
		</a>

		<button class="flex items-center p-3 text-sm w-auto p-2 rounded-3xl border border-transparent hover:border-theme-accent hover:bg-theme-accent/5" on:click={() => __quranNavigationModalVisible.set(true)} data-umami-event="Navbar Navigation Button">
			<!-- display the chapter name on chapter page -->
			{#if $__currentPage === 'chapter'}
				{@html navbarChapterName}
				<ChevronDown />
			{/if}

			<!-- display only the page name for mushaf page -->
			{#if $__currentPage === 'mushaf'}
				Page {$__pageNumber}
				<ChevronDown />
			{/if}

			<!-- display only the division title for juz/hizb page -->
			{#if ['juz', 'hizb'].includes($__currentPage)}
				{term($__currentPage)}
				{juzOrHizbId}
				<ChevronDown />
			{/if}

			<!-- display Quranic+supplication term for supplications page -->
			{#if $__currentPage === 'supplications'}
				Quranic {term('supplications')}
			{/if}

			<!-- display only the page name for non-chapter page -->
			{#if !['chapter', 'mushaf', 'supplications', 'juz', 'hizb'].includes($__currentPage)}
				{$__currentPage[0].toUpperCase() + $__currentPage.slice(1)}

				<!-- if it's the morphology page, show morphology key as well -->
				{#if $__currentPage === 'morphology'}
					{$__morphologyKey}
				{/if}
			{/if}
		</button>

		<button class="flex flex-row items-center p-3 cursor-pointer rounded-3xl border border-transparent hover:border-theme-accent bg-theme-accent/5" type="button" aria-label="Menu" on:click={() => __siteNavigationModalVisible.set(true)}>
			<span class="text-xs pr-2 hidden md:block">Menu</span>
			<Menu />
		</button>
	</div>

	<!-- mini nav for chapter page -->
	{#if $__currentPage === 'chapter'}
		<div id="bottom-nav" class={`${getWebsiteWidth($__wideWesbiteLayoutEnabled)} flex flex-row items-center justify-between text-xs mx-auto px-6`}>
			<div id="navbar-bottom-chapter-revalation" class="flex flex-row items-center py-2">
				<span class="py-2 flex flex-row items-center gap-1">
					<svelte:component this={RevelationIcon} />
					{#if !$__topNavbarVisible}
						<span>{@html navbarChapterName}</span>
					{:else}
						{revelationTerm}
					{/if}
				</span>
			</div>
			<div class="flex flex-row items-center py-2">
				<span>{lastReadPage ? `Page ${lastReadPage}` : '...'}</span>
				<span class="px-1 opacity-30">&#8226;</span>
				<span>{lastReadJuz ? `${term('juz')} ${lastReadJuz}` : '...'}</span>
			</div>
		</div>
	{/if}

	<!-- Show the progress tracker for specific pages only -->
	{#if ['chapter', 'juz', 'hizb'].includes($__currentPage)}
		<div id="progress-bar" class="fixed inset-x-0 z-20 h-1 rounded-r-3xl bg-theme-accent" style="width: {readingProgress}%" />
	{/if}

	<!-- mini nav for mushaf page -->
	{#if $__currentPage === 'mushaf'}
		<div id="bottom-nav" class={`${getWebsiteWidth($__wideWesbiteLayoutEnabled)} flex flex-row items-center justify-between border-t border-theme-accent/20 text-xs mx-auto px-6`}>
			<div class="flex flex-row items-center py-2 truncate">
				{#if !$__topNavbarVisible}
					<span>Page {$__pageNumber} -&nbsp;</span>
				{/if}
				<span class="flex items-center">
					{#if mushafChapterInfo.length ?? false}
						{#each mushafChapterInfo as item, i (item.name)}
							<span class="flex items-center gap-1">
								<svelte:component this={item.Icon} />
								{item.name}
							</span>
							{#if i < mushafChapterInfo.length - 1}
								<span class="px-1 opacity-30">&#8226;</span>
							{/if}
						{/each}
					{:else}
						<span>{mushafChapters.join(' / ')}</span>
					{/if}
				</span>
			</div>
			<div class="flex flex-row items-center py-2 truncate">{mushafJuz}</div>
		</div>
	{/if}
</nav>

<div class="{$__currentPage === 'chapter' ? 'pb-8' : 'pb-4'} {$__currentPage === 'home' ? 'hidden' : 'block'}"></div>
