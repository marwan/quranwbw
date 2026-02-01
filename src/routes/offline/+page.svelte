<script>
	import PageHead from '$misc/PageHead.svelte';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';
	import Info from '$svgs/Info.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { __currentPage, __offlineModeSettings, __verseTafsir, __fontType, __wordTranslation, __wordTransliteration, __verseTranslations } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache, checkOnlineAndAlert } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';
	import { fetchChapterData, fetchVerseTranslationData, fetchAndCacheJson } from '$utils/fetchData';
	import { staticEndpoint, chapterHeaderFontLink, cdnStaticDataUrls, bismillahFonts, morphologyDataUrls, tafsirDataUrls } from '$data/websiteSettings';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';
	import { term } from '$utils/terminologies';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { clearDexieTable } from '$utils/dexie';

	const errorAlertMessage = 'Something went wrong. Please try again in a few moments.';

	// Chapter and Quran pages count
	const totalChapters = 10;
	const totalPages = 20;

	let isRegistering = false;
	let isDownloadingChapter = false;
	let isDownloadingJuz = false;
	let isDownloadingMushaf = false;
	let isDownloadingMorphology = false;
	let isDownloadingTafsir = false;

	// Initialize structures on component load
	ensureOfflineSettingsStructure('serviceWorker');
	ensureOfflineSettingsStructure('chapterData');
	ensureOfflineSettingsStructure('juzData');
	ensureOfflineSettingsStructure('mushafData');
	ensureOfflineSettingsStructure('morphologyData');
	ensureOfflineSettingsStructure('tafsirData');
	ensureOfflineSettingsStructure('downloadedDataSettings', {
		fontTypes: [],
		wordTranslations: [],
		wordTransliterations: [],
		verseTranslations: []
	});

	// Reactive statement for local reference
	$: offlineModeSettings = $__offlineModeSettings;

	// Reactive variables for basic checks
	$: isServiceWorkerRegistered = offlineModeSettings?.serviceWorker?.downloaded ?? false;
	$: isChapterDataDownloaded = offlineModeSettings?.chapterData?.downloaded ?? false;
	$: isJuzDataDownloaded = offlineModeSettings?.juzData?.downloaded ?? false;
	$: isMushafDataDownloaded = offlineModeSettings?.mushafData?.downloaded ?? false;
	$: isMorphologyDataDownloaded = offlineModeSettings?.morphologyData?.downloaded ?? false;
	$: isTafsirDataDownloaded = offlineModeSettings?.tafsirData?.downloaded ?? false;

	// Track if ANY download is in progress
	$: isDownloading = isRegistering || isDownloadingChapter || isDownloadingJuz || isDownloadingMushaf || isDownloadingMorphology || isDownloadingTafsir;

	// Track the download progress percentage
	$: downloadProgressPercentage = 0;

	// Recompute whether the downloaded offline data still matches the user's current settings whenever any related store value changes
	$: downloadedDataSettingsMismatch = hasOfflineSettingsMismatch($__offlineModeSettings, $__fontType, $__wordTranslation, $__wordTransliteration, $__verseTranslations);

	// Listen for cache started
	window.addEventListener('sw-cache-started', () => {
		isRegistering = true;
	});

	// Listen for cache completion
	window.addEventListener('sw-cache-complete', () => {
		isRegistering = false;

		// Update using helper function
		updateOfflineSettingsStructure('serviceWorker', {
			downloaded: true,
			downloadedAt: new Date().toISOString()
		});
	});

	// Helper function to ensure nested structure exists with custom properties
	function ensureOfflineSettingsStructure(key, defaultStructure = { downloaded: false, downloadedAt: null }) {
		if (!$__offlineModeSettings) {
			$__offlineModeSettings = {};
		}

		if (!$__offlineModeSettings[key]) {
			$__offlineModeSettings[key] = { ...defaultStructure };
		}
	}

	// Helper function to update a specific structure and save to localStorage
	function updateOfflineSettingsStructure(key, updates) {
		ensureOfflineSettingsStructure(key);

		// Merge updates into existing structure
		offlineModeSettings[key] = {
			...offlineModeSettings[key],
			...updates
		};

		// Save to localStorage
		updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });
	}

	// Helper to cache URL to specific cache
	async function cacheUrlToCache(url, cacheName) {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'CACHE_URL',
				url: url,
				cacheName: cacheName
			});
			// Small delay to ensure caching completes
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}

	// Helper to delete specific cache
	async function deleteSpecificCache(cacheName) {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'DELETE_CACHE',
				cacheName: cacheName
			});
		}

		window.umami?.track(`Delete Specific Cache (${cacheName})`);
	}

	// Helper function to add downloaded data settings
	// Tracks fontTypes, wordTranslations, wordTransliterations, and verseTranslations
	function addDownloadedDataSettings({ fontTypes, wordTranslation, wordTransliteration, verseTranslations }) {
		// Ensure structure exists
		ensureOfflineSettingsStructure('downloadedDataSettings', {
			fontTypes: [],
			wordTranslations: [],
			wordTransliterations: [],
			verseTranslations: []
		});

		// Get current settings
		const currentSettings = offlineModeSettings.downloadedDataSettings;

		// Helper to merge arrays without duplicates
		const mergeArrays = (current, newItems) => {
			const itemsArray = Array.isArray(newItems) ? newItems : [newItems];
			return [...new Set([...current, ...itemsArray])];
		};

		// Update font types if provided
		if (fontTypes !== undefined && fontTypes !== null) {
			currentSettings.fontTypes = mergeArrays(currentSettings.fontTypes, fontTypes);
		}

		// Update word translations if provided
		if (wordTranslation !== undefined && wordTranslation !== null) {
			currentSettings.wordTranslations = mergeArrays(currentSettings.wordTranslations, wordTranslation);
		}

		// Update word transliterations if provided
		if (wordTransliteration !== undefined && wordTransliteration !== null) {
			currentSettings.wordTransliterations = mergeArrays(currentSettings.wordTransliterations, wordTransliteration);
		}

		// Update verse translations if provided
		if (verseTranslations !== undefined && verseTranslations !== null) {
			currentSettings.verseTranslations = mergeArrays(currentSettings.verseTranslations, verseTranslations);
		}

		// Save to localStorage
		updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });
	}

	// Helper function to update the download progress percentage
	function updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress) {
		downloadProgressPercentage = Math.round((completedStepsInDownloadProgress / totalStepsInDownloadProgress) * 100);
	}

	// Download and cache all chapter and verse translation/transliteration data files
	async function downloadChapterAndVerseTranslationData({ fontType, wordTranslation, wordTransliteration, verseTranslations }) {
		try {
			// Use provided values or fall back to current user settings
			const activeFontType = fontType ?? $__fontType;
			const activeWordTranslation = wordTranslation ?? $__wordTranslation;
			const activeWordTransliteration = wordTransliteration ?? $__wordTransliteration;
			const activeVerseTranslations = verseTranslations ?? $__verseTranslations;

			// If fontType is an array, use the first item for fetching
			const fontTypeForFetch = Array.isArray(activeFontType) ? activeFontType[0] : activeFontType;

			// Fetch chapter data with the specified font type
			await fetchChapterData({ chapter: 1, fontType: fontTypeForFetch, preventStoreUpdate: true });

			// Fetch verse translations
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Track what was downloaded (use original activeFontType which could be array)
			addDownloadedDataSettings({
				fontTypes: activeFontType,
				wordTranslation: activeWordTranslation,
				wordTransliteration: activeWordTransliteration,
				verseTranslations: activeVerseTranslations
			});
		} catch (error) {
			console.warn('Failed to download chapter and verse translation data:', error);
			throw error;
		}
	}

	// Checks whether the user's current settings are fully covered by the previously downloaded offline data.
	// Returns true if any required setting is missing (indicating a re-download is recommended).
	function hasOfflineSettingsMismatch() {
		try {
			const downloadedDataSettings = $__offlineModeSettings.downloadedDataSettings;
			const { fontTypes = [], wordTranslations = [], wordTransliterations = [], verseTranslations: downloadedVerseTranslations = [] } = downloadedDataSettings;

			// Single-value checks (only if data exists)
			if (fontTypes.length && !fontTypes.includes($__fontType)) return true;
			if (wordTranslations.length && !wordTranslations.includes($__wordTranslation)) return true;
			if (wordTransliterations.length && !wordTransliterations.includes($__wordTransliteration)) return true;

			// Multi-value check (only if data exists)
			if (downloadedVerseTranslations.length && Array.isArray($__verseTranslations) && $__verseTranslations.some((t) => !downloadedVerseTranslations.includes(t))) {
				return true;
			}

			return false;
		} catch (error) {
			console.warn('Offline settings mismatch check failed:', error);
			return false;
		}
	}

	// Core data registration
	async function handleCoreDataRegister() {
		if (!(await checkOnlineAndAlert())) return;

		isRegistering = true;
		downloadProgressPercentage = 0;

		try {
			// Total steps: 1 service worker registration + 3 data fetches + 1 buffer
			const totalStepsInDownloadProgress = 4 + 1;
			let completedStepsInDownloadProgress = 0;

			const result = await registerServiceWorker();
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			if (!result.success) {
				throw new Error(result.error);
			}

			// Download all CDN static data files
			await downloadAllCdnStaticData();
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Download all bismillah fonts
			await downloadAllBismillahFonts();
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Download chapter header font
			await downloadChapterHeaderFont();
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			window.umami?.track('Core Data Download');
		} catch (error) {
			console.warn('Core data registration failed:', error);
			showAlert(errorAlertMessage, '');
			isRegistering = false;
		}
	}

	// Core data unregistration
	async function handleCoreDataUnregister() {
		try {
			await unregisterServiceWorkerAndClearCache();

			// Empty the object
			offlineModeSettings = {};

			// Save to localStorage
			updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });

			window.umami?.track('Core Data Delete');
		} catch (error) {
			console.warn('Core data unregistration failed:', error);
			showAlert(errorAlertMessage, '');
		}
	}

	// Delete specific cache data
	async function handleDeleteSpecificCache(cacheName, objectName) {
		try {
			// Delete the data from both cache and indexedDB
			await deleteSpecificCache(cacheName);
			await clearDexieTable(cacheName);

			updateOfflineSettingsStructure(objectName, {
				downloaded: false,
				downloadedAt: null
			});
		} catch (error) {
			console.warn('Delete specific cache failed:', error);
			showAlert(errorAlertMessage, '');
		}
	}

	// Cache all 114 chapter routes and download chapter data based on user's settings
	async function handleDownloadChaptersData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingChapter = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('chapterData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Total steps: 114 chapter routes + 1 data fetch + 1 buffer
			const totalStepsInDownloadProgress = totalChapters + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Download all 114 chapter routes (service worker will cache them automatically)
			const chapterRoutes = Array.from({ length: totalChapters }, (_, i) => `/${i + 1}`);

			for (const route of chapterRoutes) {
				await cacheUrlToCache(route, 'quranwbw-chapter-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Download chapter and verse data
			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Mark as complete
			updateOfflineSettingsStructure('chapterData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Chapter Data Download');
		} catch (error) {
			console.warn('Chapter download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingChapter = false;
			downloadProgressPercentage = 100;
		}
	}

	// Cache all 30 juz routes and download chapter data based on user's settings
	async function handleDownloadJuzData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingJuz = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('juzData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			const totalJuz = 30;

			// Total steps: 30 juz routes + 1 data fetch + 1 buffer
			const totalStepsInDownloadProgress = totalJuz + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Download all 30 juz routes (service worker will cache them automatically)
			const juzRoutes = Array.from({ length: totalJuz }, (_, i) => `/juz/${i + 1}`);

			for (const route of juzRoutes) {
				await cacheUrlToCache(route, 'quranwbw-juz-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Download chapter and verse data
			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Mark as complete
			updateOfflineSettingsStructure('juzData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Juz Data Download');
		} catch (error) {
			console.warn('Juz download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingJuz = false;
			downloadProgressPercentage = 100;
		}
	}

	// Cache all 604 mushaf page routes and download mushaf font files
	async function handleDownloadMushafData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingMushaf = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('mushafData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Total steps: 604 page routes + 604 font files + 1 data fetch + 1 buffer
			const totalStepsInDownloadProgress = totalPages * 2 + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			for (let page = 1; page <= totalPages; page++) {
				// Cache all mushaf page routes
				await cacheUrlToCache(`/page/${page}`, 'quranwbw-mushaf-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

				// Cache all mushaf font files
				await cacheUrlToCache(getMushafWordFontLink(page), 'quranwbw-mushaf-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Download chapter and verse data for both font types 2 and 3
			await downloadChapterAndVerseTranslationData({ fontType: [2, 3] });
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Mark as complete
			updateOfflineSettingsStructure('mushafData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Mushaf Data Download');
		} catch (error) {
			console.warn('Mushaf download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingMushaf = false;
			downloadProgressPercentage = 100;
		}
	}

	// Cache all morphology data files
	async function handleDownloadMorphologyData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingMorphology = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('morphologyData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Total steps: 114 chapter word summaries + 4 static files + 1 data fetch + 1 buffer
			const totalStepsInDownloadProgress = totalChapters + 4 + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Download word summaries for all 114 chapters
			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				await fetchAndCacheJson(morphologyDataUrls.getWordSummary(chapter), 'morphology');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Download static morphology files
			await fetchAndCacheJson(morphologyDataUrls.wordVerbs, 'morphology');
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			await fetchAndCacheJson(morphologyDataUrls.wordsWithSameRootKeys, 'morphology');
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			await fetchAndCacheJson(morphologyDataUrls.wordUthmaniAndRoots, 'morphology');
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			await fetchAndCacheJson(morphologyDataUrls.exactWordsKeys, 'morphology');
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Download chapter and verse data
			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			// Mark as complete
			updateOfflineSettingsStructure('morphologyData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Morphology Data Download');
		} catch (error) {
			console.error('Morphology download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingMorphology = false;
			downloadProgressPercentage = 100;
		}
	}

	// Cache all tafsir data files
	async function handleDownloadTafsirData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingTafsir = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('tafsirData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Total steps: 114 chapter tafsirs + 1 buffer
			const totalStepsInDownloadProgress = totalChapters + 1;
			let completedStepsInDownloadProgress = 0;

			const selectedTafirId = $__verseTafsir || 30;
			const selectedTafsir = selectableTafsirs[selectedTafirId];

			// Download tafsir data for all 114 chapters
			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				await fetchAndCacheJson(`${tafsirDataUrls[selectedTafsir.url]}/${selectedTafsir.slug}/${chapter}.json`, 'tafsir');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Mark as complete
			updateOfflineSettingsStructure('tafsirData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Tafsir Data Download');
		} catch (error) {
			console.error('Tafsir download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingTafsir = false;
			downloadProgressPercentage = 100;
		}
	}

	// Download and cache all essential CDN static data files
	async function downloadAllCdnStaticData() {
		try {
			// Iterate through all CDN static data URLs and cache them
			const cachePromises = Object.entries(cdnStaticDataUrls).map(([_, url]) => {
				return fetchAndCacheJson(url, 'other');
			});

			// Wait for all files to be cached
			await Promise.all(cachePromises);

			console.log('All CDN static data cached successfully');
		} catch (error) {
			console.warn('Failed to cache CDN static data:', error);
			throw error;
		}
	}

	// Download all bismillah fonts
	async function downloadAllBismillahFonts() {
		try {
			const fontPromises = Object.values(bismillahFonts).map(({ file, version }) => {
				const url = `${staticEndpoint}/fonts/Extras/bismillah/${file}.woff2?version=${version}`;
				return fetch(url);
			});

			// Wait for all fonts to be downloaded
			await Promise.all(fontPromises);

			console.log('All bismillah fonts cached successfully');
		} catch (error) {
			console.warn('Failed to cache bismillah fonts:', error);
			throw error;
		}
	}

	// Download chapter header font
	async function downloadChapterHeaderFont() {
		try {
			await fetch(chapterHeaderFontLink);
			console.log('Chapter header font cached successfully');
		} catch (error) {
			console.warn('Failed to cache chapter header font:', error);
			throw error;
		}
	}

	__currentPage.set('Offline Mode');
</script>

<PageHead title={'Offline Mode'} />

<div class="mx-auto">
	<div class="markdown mx-auto">
		<h3>Offline Mode</h3>
		<p>
			Offline mode lets you use parts of QuranWBW without an internet connection by saving some website data on your device. This is optional and you can update or remove the saved data at any time. Please note that enabling offline mode downloads the core website files, which may use a noticeable amount of data and take some time, especially on slower connections or mobile data. It's best to use
			a stable Wi-Fi connection if possible.
		</p>
	</div>

	{#if downloadedDataSettingsMismatch}
		<div class="mt-4 p-3 rounded-md flex flex-row space-x-2 items-center text-sm {window.theme('bgSecondaryLight')}">
			<span class="flex-shrink-0 w-4 h-4">
				<Info />
			</span>

			<span> Your settings have changed since the last download. To ensure offline access continues to work correctly, it’s recommended that you delete the existing downloaded data and download it again so it matches your current preferences. </span>
		</div>
	{/if}

	<div class="mt-6 overflow-auto">
		<table class="w-full text-sm text-left rounded-md">
			<tbody>
				<!-- Service Worker & Core Files -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {isDownloading && !isRegistering && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>Core Website Data</div>
						<div class="text-sm">These are the core files needed for the website to open and work offline. This lets you load the site and move around even when you don't have an internet connection. Quran content such as {term('chapters')}, {term('juzs')}, and Mushaf data is not included here. If you want to read those offline, they must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isServiceWorkerRegistered ? showConfirm('This will delete the core website files and all other offline data. Offline access will no longer be available.', '', () => handleCoreDataUnregister()) : handleCoreDataRegister} disabled={isDownloading}>
							{#if isServiceWorkerRegistered}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isRegistering}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Chapter Data Files (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {(!isServiceWorkerRegistered || (isDownloading && !isDownloadingChapter)) && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>{term('chapter')} Data</div>
						<div class="text-sm">These files download the Quran text data and allow you to read all 114 {term('chapters')} offline. The content follows your selected reading settings, such as translations and transliterations. Any special Mushaf font files are not included and must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isChapterDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('quranwbw-chapter-data', 'chapterData')) : handleDownloadChaptersData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isChapterDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingChapter}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Juz Data Files (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {(!isServiceWorkerRegistered || (isDownloading && !isDownloadingJuz)) && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>{term('juzs')} Data</div>
						<div class="text-sm">These files allow you to read all 30 Quran {term('juzs')} offline. The downloaded content is based on your selected settings, such as font style, translations, and transliterations.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isJuzDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('quranwbw-juz-data', 'juzData')) : handleDownloadJuzData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isJuzDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingJuz}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Mushaf Data (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {(!isServiceWorkerRegistered || (isDownloading && !isDownloadingMushaf)) && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>Mushaf Data</div>
						<div class="text-sm">These files let you open the Mushaf (page) view offline. All 604 pages, the required font files, and the Mushaf text content are included.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isMushafDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('quranwbw-mushaf-data', 'mushafData')) : handleDownloadMushafData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isMushafDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingMushaf}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Morphology Data (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {(!isServiceWorkerRegistered || (isDownloading && !isDownloadingMorphology)) && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>Morphology Data</div>
						<div class="text-sm">These files allow you to view detailed word information in the Morphology section. This includes word meanings, roots, verb forms, and related words used across the Quran.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isMorphologyDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('morphology_data', 'morphologyData')) : handleDownloadMorphologyData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isMorphologyDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingMorphology}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Tafsir Data (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {(!isServiceWorkerRegistered || (isDownloading && !isDownloadingTafsir)) && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>Tafsir Data</div>
						<div class="text-sm">These files let you read {term('tafsir')} for all {term('chapters')} offline, based on the {term('tafsir')} you have selected in your settings.</div>
					</td><td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isTafsirDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('tafsir_data', 'tafsirData')) : handleDownloadTafsirData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isTafsirDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingTafsir}
								<Spinner size="8" inline={true} hideMessages={true} />
								<span>{downloadProgressPercentage}%</span>
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
