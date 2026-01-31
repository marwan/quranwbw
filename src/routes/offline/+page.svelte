<script>
	import PageHead from '$misc/PageHead.svelte';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { __currentPage, __offlineModeSettings, __fontType } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache, isUserOnline, showOfflineAlert } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { fetchChapterData, fetchVerseTranslationData, fetchAndCacheJson } from '$utils/fetchData';
	import { staticEndpoint, chapterHeaderFontLink, cdnStaticDataUrls, bismillahFonts } from '$data/websiteSettings';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';

	let isRegistering = false;
	let isDownloadingChapter = false;
	let isDownloadingJuz = false;
	let isDownloadingMushaf = false;

	// Initialize structures on component load
	ensureOfflineSettingsStructure('serviceWorker');
	ensureOfflineSettingsStructure('chapterData');
	ensureOfflineSettingsStructure('juzData');
	ensureOfflineSettingsStructure('mushafData');

	// Reactive statement for local reference
	$: offlineModeSettings = $__offlineModeSettings;

	// Reactive variables for basic checks
	$: isServiceWorkerRegistered = offlineModeSettings?.serviceWorker?.downloaded ?? false;
	$: isChapterDataDownloaded = offlineModeSettings?.chapterData?.downloaded ?? false;
	$: isJuzDataDownloaded = offlineModeSettings?.juzData?.downloaded ?? false;
	$: isMushafDataDownloaded = offlineModeSettings?.mushafData?.downloaded ?? false;

	// Track if ANY download is in progress
	$: isDownloading = isRegistering || isDownloadingChapter || isDownloadingJuz || isDownloadingMushaf;

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
	// Examples:
	// ensureOfflineSettingsStructure('serviceWorker', { downloaded: false, downloadedAt: null })
	// ensureOfflineSettingsStructure('chapterData', { downloaded: false, downloadedAt: null, chapters: [] })
	// ensureOfflineSettingsStructure('mushafData', { downloaded: false, downloadedAt: null, fonts: ['uthmanic'] })
	function ensureOfflineSettingsStructure(key, defaultStructure = { downloaded: false, downloadedAt: null }) {
		if (!$__offlineModeSettings) {
			$__offlineModeSettings = {};
		}

		if (!$__offlineModeSettings[key]) {
			$__offlineModeSettings[key] = { ...defaultStructure };
		}
	}

	// Helper function to update a specific structure and save to localStorage
	// Examples:
	// updateOfflineSettingsStructure('serviceWorker', { downloaded: true, downloadedAt: new Date().toISOString() })
	// updateOfflineSettingsStructure('chapterData', { downloaded: true, chapters: [1, 2, 3] })
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

	// Helper function to add font types to downloaded list
	// Examples:
	// addDownloadedFontTypes(1) - Adds font type 1
	// addDownloadedFontTypes([2, 3]) - Adds font types 2 and 3
	function addDownloadedFontTypes(fontTypes) {
		// Ensure downloadedFontTypes structure exists
		ensureOfflineSettingsStructure('downloadedFontTypes', []);

		// Convert single number to array for consistent handling
		const fontTypesArray = Array.isArray(fontTypes) ? fontTypes : [fontTypes];

		// Get current downloaded font types (ensure it's an array)
		const currentFontTypes = Array.isArray(offlineModeSettings.downloadedFontTypes) ? offlineModeSettings.downloadedFontTypes : [];

		// Add new font types, avoiding duplicates
		const updatedFontTypes = [...new Set([...currentFontTypes, ...fontTypesArray])];

		// Update in localStorage
		offlineModeSettings.downloadedFontTypes = updatedFontTypes;
		updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });
	}

	// Core data registration
	async function handleCoreDataRegister() {
		if (!isUserOnline()) return showOfflineAlert();

		isRegistering = true;
		const result = await registerServiceWorker();

		// Download all CDN static data files
		await downloadAllCdnStaticData();

		// Download all bismillah fonts
		await downloadAllBismillahFonts();

		// Download chapter header font
		await downloadChapterHeaderFont();

		window.umami?.track('Core Data Download');

		if (!result.success) {
			alert('Failed to enable offline mode: ' + result.error);
			isRegistering = false;
		}
	}

	// Core data unregistration
	async function handleCoreDataUnregister() {
		await unregisterServiceWorkerAndClearCache();

		// Empty the object
		offlineModeSettings = {};

		// Save to localStorage
		updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });

		window.umami?.track('Core Data Delete');
	}

	// Delete specific cache data
	async function handleDeleteSpecificCache(cacheName, objectName) {
		await deleteSpecificCache(cacheName);

		updateOfflineSettingsStructure(objectName, {
			downloaded: false,
			downloadedAt: null
		});
	}

	// Cache all 114 chapter routes and download chapter data based on user's settings
	async function handleDownloadChaptersData() {
		if (!isUserOnline()) return showOfflineAlert();

		isDownloadingChapter = true;

		ensureOfflineSettingsStructure('chapterData', {
			downloaded: false,
			downloadedAt: null,
			fontType: $__fontType
		});

		try {
			// Download all 114 chapter routes (service worker will cache them automatically)
			const chapterRoutes = Array.from({ length: 114 }, (_, i) => `/${i + 1}`);

			for (const route of chapterRoutes) {
				await cacheUrlToCache(route, 'quranwbw-chapter-data');
			}

			// Fetch chapter data and translations
			await fetchChapterData({ chapter: 1, preventStoreUpdate: true });
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Save the current selected user's font type so we can enable these in offline mode
			addDownloadedFontTypes($__fontType);

			// Mark as complete
			updateOfflineSettingsStructure('chapterData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloadingChapter = false;

			window.umami?.track('Chapter Data Download');
		} catch (error) {
			console.warn('Chapter download failed:', error);
			alert('Failed to download chapters: ' + error.message);
			isDownloadingChapter = false;
		}
	}

	// Cache all 30 juz routes and download chapter data based on user's settings
	async function handleDownloadJuzData() {
		if (!isUserOnline()) return showOfflineAlert();

		isDownloadingJuz = true;

		ensureOfflineSettingsStructure('juzData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Download all 30 juz routes (service worker will cache them automatically)
			const juzRoutes = Array.from({ length: 30 }, (_, i) => `/juz/${i + 1}`);

			for (const route of juzRoutes) {
				await cacheUrlToCache(route, 'quranwbw-juz-data');
			}

			// Fetch chapter data and translations
			await fetchChapterData({ chapter: 1, preventStoreUpdate: true });
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Save the current selected user's font type so we can enable these in offline mode
			addDownloadedFontTypes($__fontType);

			// Mark as complete
			updateOfflineSettingsStructure('juzData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloadingJuz = false;

			window.umami?.track('Juz Data Download');
		} catch (error) {
			console.warn('Juz download failed:', error);
			alert('Failed to download juz data: ' + error.message);
			isDownloadingJuz = false;
		}
	}

	// Cache all 604 mushaf page routes and download mushaf font files
	async function handleDownloadMushafData() {
		if (!isUserOnline()) return showOfflineAlert();

		isDownloadingMushaf = true;

		ensureOfflineSettingsStructure('mushafData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			const totalPages = 10;

			// Download all 604 mushaf page routes (service worker will cache them automatically)
			const mushafRoutes = Array.from({ length: totalPages }, (_, i) => `/page/${i + 1}`);

			for (const route of mushafRoutes) {
				await cacheUrlToCache(route, 'quranwbw-mushaf-data');
			}

			// Download all 604 mushaf font files
			for (let page = 1; page <= totalPages; page++) {
				await cacheUrlToCache(getMushafWordFontLink(page), 'quranwbw-mushaf-data');
			}

			// Fetch chapter data (mushaf text) and translations
			await fetchChapterData({ chapter: 1, fontType: 2, preventStoreUpdate: true });
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Save the Non-Tajweed and Tajweed font types so we can enable these in offline mode
			addDownloadedFontTypes([2, 3]);

			// Mark as complete
			updateOfflineSettingsStructure('mushafData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloadingMushaf = false;

			window.umami?.track('Mushaf Data Download');
		} catch (error) {
			console.warn('Mushaf download failed:', error);
			alert('Failed to download mushaf data: ' + error.message);
			isDownloadingMushaf = false;
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
		}
	}

	// Download chapter header font
	async function downloadChapterHeaderFont() {
		try {
			await fetch(chapterHeaderFontLink);
			console.log('Chapter header font cached successfully');
		} catch (error) {
			console.warn('Failed to cache chapter header font:', error);
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

	<div class="mt-6 overflow-auto">
		<table class="w-full text-sm text-left rounded-md">
			<tbody>
				<!-- Service Worker & Core Files -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {isDownloading && !isRegistering && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class={window.theme('textSecondary')}>Core Website Data</div>
						<div class="text-sm">These are the core files needed for the website to open and work offline. This lets you load the site and move around even when you don't have an internet connection. Quran content such as chapters, juz, and verses is not included here. If you want to read those offline, they must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isServiceWorkerRegistered ? showConfirm('This will delete the core website files and all other offline data. Offline access will no longer be available.', '', () => handleCoreDataUnregister()) : handleCoreDataRegister} disabled={isDownloading}>
							{#if isServiceWorkerRegistered}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isRegistering}
								<Spinner size="8" inline={true} hideMessages={true} />
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
						<div class={window.theme('textSecondary')}>Chapter Data</div>
						<div class="text-sm">These files download the Quran text data and allow you to read all 114 chapters offline. The content follows your selected reading settings, such as translations and transliterations. Any special Mushaf font files are not included and must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isChapterDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('quranwbw-chapter-data', 'chapterData')) : handleDownloadChaptersData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isChapterDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingChapter}
								<Spinner size="8" inline={true} hideMessages={true} />
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
						<div class={window.theme('textSecondary')}>Juz Data</div>
						<div class="text-sm">These files allow you to read all 30 Quran juz offline. The downloaded content is based on your selected settings, such as font style, translations, and transliterations.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isJuzDataDownloaded ? showConfirm('Are you sure you want to delete this data?', '', () => handleDeleteSpecificCache('quranwbw-juz-data', 'juzData')) : handleDownloadJuzData} disabled={!isServiceWorkerRegistered || isDownloading}>
							{#if isJuzDataDownloaded}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isDownloadingJuz}
								<Spinner size="8" inline={true} hideMessages={true} />
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Mushaf Fonts -->
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
