<script>
	import Menu from '$svgs/Menu.svelte';
	import Home from '$svgs/Home.svelte';
	import ChevronDown from '$svgs/ChevronDown.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __chapterNumber, __currentPage, __lastRead, __pageURL, __topNavbarVisible, __pageNumber, __morphologyKey, __mushafPageDivisions, __siteNavigationModalVisible, __quranNavigationModalVisible } from '$utils/stores';
	import { term } from '$utils/terminologies';

	let lastReadPage;
	let lastReadJuz;
	let navbarChapterName;
	let mushafChapters = [];
	let mushafJuz = '...';

	// Classes for the navbar
	$: navbarClasses = `${window.theme('bgMain')} border-b ${window.theme('border')} fixed w-full z-20 top-0 left-0 print:hidden ${$__currentPage === 'home' ? 'hidden' : 'block'}`;
	$: topNavClasses = `
		${$__topNavbarVisible ? 'block' : 'hidden'} 
		${['chapter', 'mushaf'].includes($__currentPage) && `border-b ${window.theme('border')} `}
		flex flex-row items-center justify-between max-w-screen-lg mx-auto px-4 py-2
	`;

	// Update last read details
	$: try {
		const lastReadElement = document.getElementById(`${$__lastRead.chapter}:${$__lastRead.verse}`);
		lastReadPage = lastReadElement?.getAttribute('data-page');
		lastReadJuz = lastReadElement?.getAttribute('data-juz');
	} catch (error) {
		console.log(error);
	}

	// Get the revelation type of the current chapter
	$: chapterRevelation = quranMetaData[$__chapterNumber].revelation;

	// Calculate the scroll progress percentage for the current chapter
	$: chapterProgress = $__lastRead.hasOwnProperty('chapter') ? ($__lastRead.verse / quranMetaData[$__lastRead.chapter].verses) * 100 : 0;

	// Get the chapter name for the navbar
	$: {
		navbarChapterName = quranMetaData[$__chapterNumber].transliteration;

		// Only show the translation if it's different from the transliteration
		if (quranMetaData[$__chapterNumber].transliteration !== quranMetaData[$__chapterNumber].translation) {
			navbarChapterName += `<span class="hidden md:inline-block">&nbsp;(${quranMetaData[$__chapterNumber].translation})</span>`;
		}
	}

	// Update chapter names for the mushaf page
	$: {
		try {
			mushafJuz = `${term('juz')} ${$__mushafPageDivisions.juz}`;
			mushafChapters = Object.values($__mushafPageDivisions.chapters).map((value) => quranMetaData[value].transliteration);
		} catch (error) {
			// console.log(error);
		}
	}
</script>

<nav id="navbar" class={navbarClasses}>
	<div id="top-nav" class={topNavClasses} aria-label="Home">
		<a href="/" class="flex flex-row items-center p-3 cursor-pointer rounded-3xl {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" aria-label="Home">
			<Home />
			<span class="text-xs pl-2 hidden md:block">Home</span>
		</a>

		<button class="flex items-center p-3 text-sm w-auto p-2 rounded-3xl {window.theme('hoverBorder')} {window.theme('hover')}" on:click={() => __quranNavigationModalVisible.set(true)}>
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

			<!-- display only the juz number for juz page -->
			{#if $__currentPage === 'juz'}
				{document.title.split(' - ')[0]}
				<ChevronDown />
			{/if}

			<!-- display Quranic+supplication term for supplications page -->
			{#if $__currentPage === 'supplications'}
				Quranic {term('supplications')}
			{/if}

			<!-- display only the page name for non-chapter page -->
			{#if !['chapter', 'mushaf', 'supplications', 'juz'].includes($__currentPage)}
				{$__currentPage[0].toUpperCase() + $__currentPage.slice(1)}

				<!-- if it's the morphology page, show morphology key as well -->
				{#if $__currentPage === 'morphology'}
					{$__morphologyKey}
				{/if}
			{/if}
		</button>

		<button class="flex flex-row items-center p-3 cursor-pointer rounded-3xl {window.theme('hoverBorder')} {window.theme('bgSecondaryLight')}" type="button" aria-label="Menu" on:click={() => __siteNavigationModalVisible.set(true)}>
			<span class="text-xs pr-2 hidden md:block">Menu</span>
			<Menu />
		</button>
	</div>

	<!-- mini nav for chapter page -->
	{#if $__currentPage === 'chapter'}
		<div id="bottom-nav" class="flex flex-row items-center justify-between text-xs max-w-screen-lg mx-auto px-6">
			<div id="navbar-bottom-chapter-revalation" class="flex flex-row items-center py-2">
				{#if !$__topNavbarVisible}
					<span>{@html navbarChapterName}</span>
				{:else}
					<span>{chapterRevelation === 1 ? term('meccan') : term('medinan')}</span>
				{/if}
			</div>
			<div class="flex flex-row items-center py-2">
				<span>{lastReadPage ? `Page ${lastReadPage}` : '...'}</span>
				<span class="px-1 opacity-70">/</span>
				<span>{lastReadJuz ? `${term('juz')} ${lastReadJuz}` : '...'}</span>
			</div>
		</div>

		<div id="chapter-progress-bar" class="fixed inset-x-0 z-20 h-1 rounded-r-3xl {window.theme('bgSecondary')}" style="width: {chapterProgress}%" />
	{/if}

	<!-- mini nav for mushaf page -->
	{#if $__currentPage === 'mushaf'}
		<div id="bottom-nav" class="flex flex-row items-center justify-between border-t {window.theme('border')} text-xs max-w-screen-lg mx-auto px-6">
			<div class="flex flex-row items-center py-2">
				{#if !$__topNavbarVisible}
					<span>Page {$__pageNumber} -&nbsp;</span>
				{/if}
				<span>{mushafChapters.join(' / ')}</span>
			</div>
			<div class="flex flex-row items-center py-2">{mushafJuz}</div>
		</div>
	{/if}
</nav>

<div class="{$__currentPage === 'chapter' ? 'pb-8' : 'pb-4'} {$__currentPage === 'home' ? 'hidden' : 'block'}"></div>
