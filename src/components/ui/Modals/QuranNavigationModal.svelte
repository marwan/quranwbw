<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Input from '$ui/FlowbiteSvelte/forms/Input.svelte';
	import CloseButton from '$ui/FlowbiteSvelte/utils/CloseButton.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import Search from '$svgs/Search.svelte';
	import { quranMetaData, startPageOfChapters, pageNumberKeys, juzMeta, mostRead } from '$data/quranMeta';
	import { buttonClasses } from '$data/commonClasses';
	import { __chapterNumber, __pageURL, __currentPage, __pageNumber, __quranNavigationModalVisible, __lastRead, __morphologyKey, __wideWesbiteLayoutEnabled } from '$utils/stores';
	import { inview } from 'svelte-inview';
	import { validateKey } from '$utils/validateKey';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { page } from '$app/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { getWebsiteWidth } from '$utils/getWebsiteWidth';

	// CSS classes
	const linkClasses = 'flex flex-row space-x-2 items-center';
	const linkTextClasses = `px-4 py-2 rounded-3xl border ${window.theme('border')} ${window.theme('hover')} w-fit text-sm`;
	const listItemClasses = `py-2 px-2 text-sm w-full text-left font-normal rounded-3xl ${window.theme('hoverBorder')} ${window.theme('hover')}`;

	let maxChaptersLoaded = false;
	let maxVersesLoaded = false;
	let maxItemsToLoad = 20;
	let maxVersesToLoad = 1;
	let searchedKey = '';
	let placeholder = 'Navigate or Search Quran';
	let verseKeyData;
	let searchResults;
	let morphologyKey = '1:1';

	// Hide the navigation modal when page URL or chapter/page number changes
	$: if ($page.url.href || $__pageURL || $__chapterNumber || $__pageNumber) {
		__quranNavigationModalVisible.set(false);
	}

	// Clear the searched key when the current page changes
	$: if ($__currentPage) {
		searchedKey = '';
	}

	// Get the number of verses in the current chapter
	$: chapterVerses = quranMetaData[$__chapterNumber]?.verses ?? 0;

	// Validate the searched key and fetch search results
	$: (async () => {
		searchResults = await validateKey(searchedKey);
	})();

	// Update the max number of verses to load
	$: {
		maxVersesLoaded = false;
		maxVersesToLoad = Math.min(chapterVerses, maxItemsToLoad);
	}

	// Load verse key data externally to reduce bundle size
	$: if ($__quranNavigationModalVisible || ['mushaf', 'morphology'].includes($__currentPage)) {
		(async () => {
			verseKeyData = await fetchAndCacheJson(cdnStaticDataUrls.verseKeyData, 'other');
		})();
	}

	// Focus the search input box
	$: if ($__quranNavigationModalVisible) {
		setTimeout(() => {
			document.getElementById('searchKey').focus();
		}, 1);
	}

	// Update morphology key for the morphology page
	$: if ($__morphologyKey) {
		morphologyKey = $__morphologyKey.split(':').slice(0, 2).join(':');
	}

	// Load all chapters when necessary
	function loadMaxChapters() {
		if (!maxChaptersLoaded) {
			maxItemsToLoad = 114;
			maxChaptersLoaded = true;
		}
	}

	// Load all verses when necessary
	function loadMaxVerses() {
		if (!maxVersesLoaded) {
			maxVersesToLoad = chapterVerses;
			maxVersesLoaded = true;
		}
	}
</script>

<Modal id="quranNavigationModal" bind:open={$__quranNavigationModalVisible} transitionParams={getModalTransition('top')} title="Navigate" size="md" class="!rounded-t-none md:!rounded-3xl" bodyClass="md:p-2 !border-t-0" headerClass="hidden" placement="center" position="top" outsideclose>
	<div class={`${getWebsiteWidth($__wideWesbiteLayoutEnabled)} flex flex-col space-y-2 justify-between px-4 py-5 mx-auto`}>
		<!-- search block -->
		<div id="search-block" class="mx-2">
			<div id="navigation-inputs" class="flex flex-col justify-start">
				<div class="flex flex-row w-full h-fit items-center">
					<form on:submit|preventDefault={() => (searchedKey = document.getElementById('searchKey').value)} class="flex flex-row w-full">
						<Input id="searchKey" type="text" bind:value={searchedKey} autocomplete="off" {placeholder} size="md" class="bg-transparent rounded-3xl !text-center pl-10 px-8 {window.theme('placeholder')}">
							<Search slot="left" size={7} classes="pl-2 pt-1 {searchedKey.length > 0 && 'hidden'}" />
							<CloseButton slot="right" on:click={() => (searchedKey = '')} class="pr-2 {searchedKey.length === 0 && 'hidden'}" />
						</Input>
					</form>
				</div>

				<!-- instructions -->
				<div id="search-instructions" class="text-xs pt-2 opacity-70 pb-4">
					Enter a {term('chapter').toLowerCase()}, page, {term('juz').toLowerCase()} number, or {term('verse').toLowerCase()}/word key (e.g., 2:255, 2.286, 18-10, 2 1 1). You can also navigate using surah names (e.g., faatiha, kahf, mary).
				</div>

				<!-- suggestions (only for home page) -->
				{#if searchedKey.length === 0 && $__currentPage === 'home'}
					<div id="search-suggestions" class="flex flex-col text-base md:text-lg max-h-64 min-h-64 overflow-y-auto">
						<!-- Last Read -->
						{#if Object.prototype.hasOwnProperty.call($__lastRead, 'chapter')}
							{@const lastReadChapter = $__lastRead.chapter}
							{@const lastReadVerse = $__lastRead.verse}
							<div id="last-read-links" class="py-2 space-y-2">
								<span class="text-xs font-semibold pt-2">Last Read</span>
								<div class={linkClasses}>
									<span>{@html '&#10230'}</span>
									<a href="/{lastReadChapter}/{lastReadVerse}" class={linkTextClasses}>{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}</a>
								</div>
							</div>
						{/if}

						<!-- Suggestions -->
						<div id="suggestions-links" class="py-2 space-y-2">
							<span class="text-xs font-semibold pt-2">Suggestions</span>
							{#each Object.entries(mostRead) as [_, item]}
								<div class={linkClasses}>
									<span>{@html '&#10230'}</span>
									<a href={item.url} class={linkTextClasses}>{quranMetaData[item.chapter].transliteration} ({item.verses})</a>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- results -->
				{#if searchedKey.length > 0}
					<div id="search-results" class="flex flex-col text-base md:text-lg max-h-64 min-h-64 overflow-y-auto">
						{#if searchResults}
							<!-- stuff for current chapter -->
							{#each Object.entries(searchResults) as [key, value]}
								<!-- numbers -->
								{#if $__chapterNumber !== 'mushaf'}
									{#if key === 'verse' && $__currentPage === 'chapter'}
										<div id="current-chapter-links" class="py-2 space-y-2">
											<span class="text-xs font-semibold">Current {term('chapter')}</span>
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{$__chapterNumber}?startVerse={value}" class={linkTextClasses}>{term('verse')} {value}</a>
											</div>
										</div>
									{/if}
								{/if}
							{/each}

							<!-- Navigate options/links -->
							<div id="navigate-links" class="py-2 space-y-2">
								<span class="text-xs font-semibold">Navigate</span>
								{#each Object.entries(searchResults) as [key, value]}
									<!-- numbers -->
									{#if $__currentPage === 'mushaf'}
										{#if key === 'chapter'}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/page/{startPageOfChapters[value]}" class={linkTextClasses}>{term('chapter')} {value} ({quranMetaData[value].transliteration})</a>
											</div>
										{:else if key === 'page'}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/page/{value}" class={linkTextClasses}>Page {value}</a>
											</div>
										{/if}

										<!-- only show results of key-pages if we have loaded the data -->
										{#await verseKeyData then verseKeyData}
											{#if key === 'juz'}
												<div class={linkClasses}>
													<span>{@html '&#10230'}</span>
													<a href="/page/{verseKeyData[juzMeta[value - 1].from].page}" class={linkTextClasses}>{term('juz')} {value}</a>
												</div>
											{:else if key === 'key'}
												<div class={linkClasses}>
													<span>{@html '&#10230'}</span>
													<a href="/page/{verseKeyData[value].page}" class={linkTextClasses}>{quranMetaData[value.split(':')[0]].transliteration}, {term('verse')} {value.split(':')[1]} (Page {verseKeyData[value].page})</a>
												</div>
											{/if}
										{/await}
									{:else if $__chapterNumber !== 'mushaf'}
										{#if key === 'chapter'}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{value}" class={linkTextClasses}>{term('chapter')} {value} ({quranMetaData[value].transliteration})</a>
											</div>
										{:else if key === 'page'}
											{@const [pageChapter, pageVerse] = pageNumberKeys[value - 1].split(':').map(Number)}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{pageChapter}/{pageVerse}" class={linkTextClasses}>Page {value} ({quranMetaData[pageChapter].transliteration})</a>
											</div>

											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/page/{value}" class={linkTextClasses}>Mushaf Page {value} ({quranMetaData[pageNumberKeys[value - 1].split(':')[0]].transliteration})</a>
											</div>
										{:else if key === 'juz'}
											{@const [juzChapter, juzVerse] = juzMeta[value - 1]['from'].split(':').map(Number)}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{juzChapter}/{juzVerse}" class={linkTextClasses}>{term('juz')} {value} ({juzMeta[value - 1].name})</a>
											</div>
										{:else if key === 'key'}
											{@const [keyChapter, keyVerse] = value.split(':').map(Number)}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{keyChapter}/{keyVerse}" class={linkTextClasses}>{quranMetaData[keyChapter].transliteration}, {term('verse')} {keyVerse}</a>
											</div>
										{:else if key === 'supplications'}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{term('supplications').toLowerCase()}#{value}" class={linkTextClasses}>{quranMetaData[value.split(':')[0]].transliteration}, {value} ({term('supplications').slice(0, -1)}) </a>
											</div>
										{/if}
									{/if}

									<!-- word key -->
									{#if key === 'word'}
										<div class={linkClasses}>
											<span>{@html '&#10230'}</span>
											<a href="/morphology?word={value}" class={linkTextClasses}>Word {value} Morphology</a>
										</div>
									{/if}

									<!-- chapter names -->
									{#if key === 'chapters' && Object.keys(value).length > 0}
										{#each Object.entries(value) as [key, value]}
											<div class={linkClasses}>
												<span>{@html '&#10230'}</span>
												<a href="/{key}" class={linkTextClasses}>{term('chapter')} {value.transliteration} <span class="hidden md:inline-block">({value.translation})</span></a>
											</div>
										{/each}
									{/if}
								{/each}
							</div>
						{/if}

						<!-- always allow user to search the Quran -->
						{#if searchedKey.length > 0}
							<div id="search-quran" class="py-2 space-y-2">
								<span class="text-xs font-semibold">Search Quran</span>
								<div class={linkClasses}>
									<span>{@html '&#10230'}</span>
									<a href="/search?query={searchedKey}" class={linkTextClasses}>"{searchedKey}"</a>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- chapter and verse selectors -->
		{#if $__currentPage !== 'home'}
			<div id="chapter-and-verses-block" class="flex flex-row space-x-4 !mt-[-0rem] max-h-64 min-h-64 {searchedKey.length > 0 ? 'hidden' : 'block'}">
				<!-- chapter selector -->
				{#if !['morphology'].includes($__currentPage)}
					<div class="flex flex-col py-2 space-y-2 w-full">
						<div class="px-2 pb-2 text-xs font-semibold border-b {window.theme('border')}">{term('chapters')}</div>
						<ul id="navbar-chapter-list" class="grow basis-1/2 overflow-y-scroll">
							{#each { length: maxItemsToLoad } as _, chapter}
								<li>
									<a href={$__currentPage === 'mushaf' ? `/page/${startPageOfChapters[chapter + 1]}` : `/${chapter + 1}`}>
										<div class="{listItemClasses} {$__currentPage === 'chapter' ? (chapter + 1 === $__chapterNumber ? `${window.theme('bgSecondaryLight')}` : null) : null}">
											{chapter + 1}. {quranMetaData[chapter + 1].transliteration}

											{#if $__currentPage === 'chapter'}
												<span class="hidden md:inline-block">({quranMetaData[chapter + 1].translation})</span>
											{:else}
												<span>({quranMetaData[chapter + 1].translation})</span>
											{/if}
										</div>
									</a>
								</li>
							{/each}
							{#if !maxChaptersLoaded}
								<Spinner size="8" inline={true} />
							{/if}
							<div class="invisible" use:inview on:inview_enter={() => loadMaxChapters()}></div>
						</ul>
					</div>
				{/if}

				<!-- verse selector -->
				{#if $__currentPage === 'chapter'}
					<div class="flex flex-col py-2 space-y-2 w-44">
						<div class="mx-4 pb-2 text-xs font-semibold border-b {window.theme('border')}">{term('verses')}</div>
						<ul id="navbar-verse-list" class="grow basis-1/2 px-2 overflow-y-scroll">
							{#key $__chapterNumber}
								{#each { length: maxVersesToLoad } as _, verse}
									<li>
										<a href="/{$__chapterNumber}?startVerse={verse + 1}">
											<div class={listItemClasses}>{term('verse')} {verse + 1}</div>
										</a>
									</li>
								{/each}
								{#if !maxVersesLoaded && chapterVerses > maxItemsToLoad}
									<Spinner size="8" inline={true} />
								{/if}
							{/key}

							<div class="invisible" use:inview on:inview_enter={() => loadMaxVerses()}></div>
						</ul>
					</div>
				{/if}

				<!-- supplications selector -->
				<!-- {#if $__currentPage === 'supplications'}
					<div class="flex flex-col space-y-2 w-full">
						<div class="px-2 text-sm pb-2 border-b {window.theme('border')} font-medium">{term('supplications')}</div>
						<ul id="navbar-supplications-list" class="grow basis-1/2 px-2 overflow-y-scroll">
							{#each Object.entries(supplicationsFromQuran) as [key, value]}
								<li>
									<a href="#{key}">
										<div class={listItemClasses}>{quranMetaData[key.split(':')[0]].transliteration}, {key}</div>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if} -->

				<!-- words selector -->
				{#if $__currentPage === 'morphology'}
					<div class="flex flex-col space-y-2 w-full">
						<div class="px-2 text-sm pb-2 border-b {window.theme('border')} font-medium">Words</div>
						{#await verseKeyData then verseKeyData}
							<ul id="navbar-words-list" class="grow basis-1/2 px-2 overflow-y-scroll">
								{#each { length: verseKeyData[morphologyKey].words } as _, word}
									<li>
										<a href="/morphology?word={morphologyKey}:{word + 1}">
											<div class={listItemClasses}>Word {morphologyKey}:{word + 1}</div>
										</a>
									</li>
								{/each}
							</ul>
						{/await}
					</div>
				{/if}
			</div>
		{/if}

		<div class="w-full px-2">
			<button class="w-full {buttonClasses}" on:click={() => __quranNavigationModalVisible.set(false)}>Close</button>
		</div>
	</div>
</Modal>
