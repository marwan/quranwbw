<script>
	import PageHead from '$misc/PageHead.svelte';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';
	import Check from '$svgs/Check.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { __currentPage, __offlineModeSettings } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import { fetchChapterData, fetchVerseTranslationData, fetchAndCacheJson } from '$utils/fetchData';
	import { staticEndpoint, chapterHeaderFontLink, cdnStaticDataUrls, bismillahFonts } from '$data/websiteSettings';
	import { getMushafWordFontLink } from '$utils/getMushafWordFontLink';

	let isRegistering = false;

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

	// Track if any download is in progress
	$: isDownloading = isRegistering;

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

	async function handleRegister() {
		isRegistering = true;
		const result = await registerServiceWorker();

		// Download all CDN static data files
		await downloadAllCdnStaticData();

		// Download all bismillah fonts
		await downloadAllBismillahFonts();

		// Download chapter header font
		await downloadChapterHeaderFont();

		if (!result.success) {
			alert('Failed to enable offline mode: ' + result.error);
			isRegistering = false;
		}
	}

	async function handleUnregister() {
		await unregisterServiceWorkerAndClearCache();

		// Empty the object
		offlineModeSettings = {};

		// Save to localStorage
		updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });
	}

	// Cache all 114 chapter routes and download chapter data based on user's settings
	async function handleDownloadChaptersData() {
		isDownloading = true;

		ensureOfflineSettingsStructure('chapterData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Download all 114 chapter routes (service worker will cache them automatically)
			const chapterRoutes = Array.from({ length: 114 }, (_, i) => `/${i + 1}`);

			for (const route of chapterRoutes) {
				await fetch(route);
			}

			// Fetch chapter data and translations
			await fetchChapterData({ chapter: 1, preventStoreUpdate: true });
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Mark as complete
			updateOfflineSettingsStructure('chapterData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloading = false;
		} catch (error) {
			console.warn('Chapter download failed:', error);
			alert('Failed to download chapters: ' + error.message);
		}
	}

	// Cache all 30 juz routes and download chapter data based on user's settings
	async function handleDownloadJuzData() {
		isDownloading = true;

		ensureOfflineSettingsStructure('juzData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			// Download all 30 juz routes (service worker will cache them automatically)
			const juzRoutes = Array.from({ length: 30 }, (_, i) => `/juz/${i + 1}`);

			for (const route of juzRoutes) {
				await fetch(route);
			}

			// Fetch chapter data and translations
			await fetchChapterData({ chapter: 1, preventStoreUpdate: true });
			await fetchVerseTranslationData({ preventStoreUpdate: true });

			// Mark as complete
			updateOfflineSettingsStructure('juzData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloading = false;
		} catch (error) {
			console.warn('Juz download failed:', error);
			alert('Failed to download juz data: ' + error.message);
		}
	}

	// Cache all 604 mushaf page routes and download mushaf font files
	async function handleDownloadMushafData() {
		isDownloading = true;

		ensureOfflineSettingsStructure('mushafData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			const totalPages = 10;

			// Download all 604 mushaf page routes (service worker will cache them automatically)
			const mushafRoutes = Array.from({ length: totalPages }, (_, i) => `/page/${i + 1}`);

			for (const route of mushafRoutes) {
				await fetch(route);
			}

			// Download all 604 mushaf font files
			for (let page = 1; page <= totalPages; page++) {
				await fetch(getMushafWordFontLink(page));
			}

			// Mark as complete
			updateOfflineSettingsStructure('mushafData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			isDownloading = false;
		} catch (error) {
			console.warn('Mushaf download failed:', error);
			alert('Failed to download mushaf data: ' + error.message);
			isDownloading = false;
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
			Offline mode lets you use parts of QuranWBW without an internet connection by saving some website data on your device. This is optional and you can update or remove the saved data at any time. Please note that enabling offline mode downloads the core website files, which may use a noticeable amount of data and take some time, especially on slower connections or mobile data. It’s best to use
			a stable Wi-Fi connection if possible.
		</p>
	</div>

	<div class="mt-6 overflow-auto">
		<table class="w-full text-sm text-left rounded-md">
			<tbody>
				<!-- Service Worker & Core Files -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')}">
					<td class="py-4 pr-4 space-y-2">
						<div class="font-semibold">Core Website Files</div>
						<div class="text-sm">These are the basic files needed for the website to open and work offline. This lets you load the site and move around even when you don't have an internet connection. Quran content such as chapters, juz, and verses is not included here. If you want to read those offline, they must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isServiceWorkerRegistered ? showConfirm('Are you sure you want to delete this data?', '', () => handleUnregister()) : handleRegister} disabled={isRegistering || isDownloading}>
							{#if isServiceWorkerRegistered}
								<Trash size={4} />
								<span>Delete</span>
							{:else if isRegistering || isDownloading}
								<Spinner size="8" inline={true} hideMessages={true} />
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Chapter Data Files (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {!isServiceWorkerRegistered && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class="font-semibold">Chapter Data Files</div>
						<div class="text-sm">These files download the Quran text data and allow you to read all 114 chapters offline. The content follows your selected reading settings, such as translations and transliterations. Any special Mushaf font files are not included and must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={handleDownloadChaptersData} disabled={isRegistering || isDownloading}>
							{#if isChapterDataDownloaded}
								<Check size={5} />
								<span>Downloaded</span>
							{:else if isDownloading}
								<Spinner size="8" inline={true} hideMessages={true} />
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Juz Data Files (only enable if service worker has been registered) -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {!isServiceWorkerRegistered && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class="font-semibold">Juz Data Files</div>
						<div class="text-sm">These files allow you to read all 30 Quran juz offline. The downloaded content is based on your selected settings, such as font style, translations, and transliterations.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={handleDownloadJuzData} disabled={isRegistering || isDownloading}>
							{#if isJuzDataDownloaded}
								<Check size={5} />
								<span>Downloaded</span>
							{:else if isDownloading}
								<Spinner size="8" inline={true} hideMessages={true} />
							{:else}
								<Download size={4} />
								<span>Download</span>
							{/if}
						</button>
					</td>
				</tr>

				<!-- Mushaf Fonts -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {!isServiceWorkerRegistered && disabledClasses}">
					<td class="py-4 pr-4 space-y-2">
						<div class="font-semibold">Mushaf Data</div>
						<div class="text-sm">These files let you open the Mushaf (page) view offline. Only the 604 page routes and the required font files are downloaded. The actual Quran text data must be downloaded separately.</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={handleDownloadMushafData} disabled={isRegistering || isDownloading}>
							{#if isMushafDataDownloaded}
								<Check size={5} />
								<span>Downloaded</span>
							{:else if isDownloading}
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
