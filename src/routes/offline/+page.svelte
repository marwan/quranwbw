<script>
	import PageHead from '$misc/PageHead.svelte';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';
	import Refresh from '$svgs/Refresh.svelte';
	import Eye from '$svgs/Eye.svelte';
	import EyeCrossed from '$svgs/EyeCrossed.svelte';
	import Info from '$svgs/Info.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { __currentPage, __offlineModeSettings, __verseTafsir, __fontType, __wordTranslation, __wordTransliteration, __verseTranslations } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache, checkOnlineAndAlert } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';
	import { fetchChapterData, fetchVerseTranslationData, fetchAndCacheJson } from '$utils/fetchData';
	import { staticEndpoint, chapterHeaderFontLink, cdnStaticDataUrls, bismillahFonts, morphologyDataUrls, tafsirDataUrls } from '$data/websiteSettings';
	import { getMushafWordFontLink, isIOSorMac } from '$utils/getMushafWordFontLink';
	import { term } from '$utils/terminologies';
	import { selectableTafsirs } from '$data/selectableTafsirs';
	import { clearDexieTable } from '$utils/dexie';

	// Common messages
	const errorAlertMessage = 'Something went wrong. Please try again in a few moments.';
	const mismatchMessage = 'Settings changed. Re-download to ensure offline access works correctly.';

	// Chapter and Quran pages count
	const totalChapters = 114;
	const totalPages = 604;

	// Track download state
	let isRegistering = false;
	let isDownloadingEssential = false;
	let isDownloadingChapter = false;
	let isDownloadingJuz = false;
	let isDownloadingMushaf = false;
	let isDownloadingMorphology = false;
	let isDownloadingTafsir = false;
	let showAdvancedDownloadOptions = false;
	let downloadProgressPercentage = 0;

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
		verseTranslations: [],
		tafsirs: []
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

	// Check if any offline data has been downloaded
	$: hasAnyOfflineData = isServiceWorkerRegistered || isChapterDataDownloaded || isJuzDataDownloaded || isMushafDataDownloaded || isMorphologyDataDownloaded || isTafsirDataDownloaded;

	// Auto-enable advanced options if any data is downloaded
	$: if (hasAnyOfflineData) showAdvancedDownloadOptions = true;

	// Track if ANY download is in progress
	$: isDownloading = isRegistering || isDownloadingEssential || isDownloadingChapter || isDownloadingJuz || isDownloadingMushaf || isDownloadingMorphology || isDownloadingTafsir;

	// Check for specific data type mismatches (reactive to all relevant stores)
	$: mismatchStatus = getOfflineSettingsMismatch($__fontType, $__wordTranslation, $__wordTransliteration, $__verseTranslations, $__verseTafsir, $__offlineModeSettings);

	// Check if chapter/juz data has mismatch (they share the same settings)
	$: hasChapterJuzMismatch = mismatchStatus.fontType || mismatchStatus.wordTranslation || mismatchStatus.wordTransliteration || mismatchStatus.verseTranslations;

	// Check if mushaf data has mismatch
	$: hasMushafMismatch = mismatchStatus.fontType;

	// Check if tafsir data has mismatch
	$: hasTafsirMismatch = mismatchStatus.verseTafsir;

	$: console.log({ hasTafsirMismatch });

	// Define data sections configuration
	$: dataSections = [
		{
			id: 'chapterData',
			title: `${term('chapter')} Data`,
			sizeLabel: '~10 MB',
			description: `These files download the Quran text data and allow you to read all 114 ${term('chapters')} offline. The content follows your selected reading settings, such as translations and transliterations. Any special Mushaf font files are not included and must be downloaded separately.`,
			isDataDownloaded: isChapterDataDownloaded,
			isDownloading: isDownloadingChapter,
			showMismatchBanner: hasChapterJuzMismatch,
			onDownload: handleDownloadChaptersData,
			onDelete: () => handleDeleteSpecificData('quranwbw-chapter-data', 'chapterData'),
			onRedownload: () => handleRedownloadData('chapterData')
		},
		{
			id: 'juzData',
			title: `${term('juzs')} Data`,
			sizeLabel: '~10 MB',
			description: `These files allow you to read all 30 Quran ${term('juzs')} offline. The downloaded content is based on your selected settings, such as font style, translations, and transliterations.`,
			isDataDownloaded: isJuzDataDownloaded,
			isDownloading: isDownloadingJuz,
			showMismatchBanner: hasChapterJuzMismatch,
			onDownload: handleDownloadJuzData,
			onDelete: () => handleDeleteSpecificData('quranwbw-juz-data', 'juzData'),
			onRedownload: () => handleRedownloadData('juzData')
		},
		{
			id: 'mushafData',
			title: 'Mushaf Data',
			sizeLabel: '~70 MB',
			description: 'These files let you open the Mushaf (page) view offline. All 604 pages, the required font files, and the Mushaf text content are included.',
			isDataDownloaded: isMushafDataDownloaded,
			isDownloading: isDownloadingMushaf,
			showMismatchBanner: hasMushafMismatch,
			onDownload: handleDownloadMushafData,
			onDelete: () => handleDeleteSpecificData('quranwbw-mushaf-data', 'mushafData'),
			onRedownload: () => handleRedownloadData('mushafData'),

			// Disabled on iOS/macOS because the current OT-SVG fallback fonts are significantly large (~190 MB), making downloads impractical.
			isSectionDisabled: () => isIOSorMac()
		},
		{
			id: 'morphologyData',
			title: 'Morphology Data',
			sizeLabel: '~50 MB',
			description: 'These files allow you to view detailed word information in the Morphology section. This includes word meanings, roots, verb forms, and related words used across the Quran.',
			isDataDownloaded: isMorphologyDataDownloaded,
			isDownloading: isDownloadingMorphology,
			showMismatchBanner: false,
			onDownload: handleDownloadMorphologyData,
			onDelete: () => handleDeleteSpecificData('morphology_data', 'morphologyData'),
			onRedownload: () => handleRedownloadData('morphologyData')
		},
		{
			id: 'tafsirData',
			title: 'Tafsir Data',
			sizeLabel: '~50 MB',
			description: `These files let you read ${term('tafsir')} for all ${term('chapters')} offline, based on the ${term('tafsir')} you have selected in your settings.`,
			isDataDownloaded: isTafsirDataDownloaded,
			isDownloading: isDownloadingTafsir,
			showMismatchBanner: hasTafsirMismatch,
			onDownload: handleDownloadTafsirData,
			onDelete: () => handleDeleteSpecificData('tafsir_data', 'tafsirData'),
			onRedownload: () => handleRedownloadData('tafsirData')
		}
	];

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
	function addDownloadedDataSettings({ fontTypes, wordTranslation, wordTransliteration, verseTranslations, tafsir }) {
		// Ensure structure exists
		ensureOfflineSettingsStructure('downloadedDataSettings', {
			fontTypes: [],
			wordTranslations: [],
			wordTransliterations: [],
			verseTranslations: [],
			tafsirs: []
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

		//  Update tafsirs if provided
		if (tafsir !== undefined && tafsir !== null) {
			currentSettings.tafsirs = mergeArrays(currentSettings.tafsirs, tafsir);
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

	// Checks whether the user's current settings match downloaded offline data
	// Returns an object with mismatch status for each data type
	function getOfflineSettingsMismatch(fontType, wordTranslation, wordTransliteration, verseTranslations, verseTafsir, offlineSettings) {
		try {
			const downloadedDataSettings = offlineSettings.downloadedDataSettings;
			if (!downloadedDataSettings) {
				return { fontType: false, wordTranslation: false, wordTransliteration: false, verseTafsir: false, verseTranslations: false };
			}

			const { fontTypes = [], wordTranslations = [], wordTransliterations = [], verseTranslations: downloadedVerseTranslations = [], tafsirs = [] } = downloadedDataSettings;

			return {
				fontType: fontTypes.length > 0 && !fontTypes.includes(fontType),
				wordTranslation: wordTranslations.length > 0 && !wordTranslations.includes(wordTranslation),
				wordTransliteration: wordTransliterations.length > 0 && !wordTransliterations.includes(wordTransliteration),
				verseTafsir: tafsirs.length > 0 && !tafsirs.includes(verseTafsir),
				verseTranslations: downloadedVerseTranslations.length > 0 && Array.isArray(verseTranslations) && verseTranslations.some((t) => !downloadedVerseTranslations.includes(t))
			};
		} catch (error) {
			console.warn('Offline settings mismatch check failed:', error);
			return { fontType: false, wordTranslation: false, wordTransliteration: false, verseTafsir: false, verseTranslations: false };
		}
	}

	// Ensure core data is downloaded (auto-download if not)
	async function ensureCoreDataDownloaded() {
		if (isServiceWorkerRegistered) {
			return; // Already downloaded
		}

		// Download core data
		const result = await registerServiceWorker();

		if (!result.success) {
			throw new Error(result.error);
		}

		// Download and cache all essential CDN static data files
		await downloadAllCdnStaticData();

		// Download all bismillah fonts
		await downloadAllBismillahFonts();

		// Download chapter header font
		await downloadChapterHeaderFont();
	}

	// Download essential data (core + chapter + juz)
	async function handleDownloadEssentialData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingEssential = true;
		downloadProgressPercentage = 0;

		try {
			// Total steps: 4 (core) + 114 (chapters) + 1 (chapter data) + 30 (juz) + 1 (juz data) + 1 buffer
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalChapters + 1 + 30 + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			// Download chapter data
			const chapterRoutes = Array.from({ length: totalChapters }, (_, i) => `/${i + 1}`);
			for (const route of chapterRoutes) {
				await cacheUrlToCache(route, 'quranwbw-chapter-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			updateOfflineSettingsStructure('chapterData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			// Download juz data
			const juzRoutes = Array.from({ length: 30 }, (_, i) => `/juz/${i + 1}`);
			for (const route of juzRoutes) {
				await cacheUrlToCache(route, 'quranwbw-juz-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

			updateOfflineSettingsStructure('juzData', {
				downloaded: true,
				downloadedAt: new Date().toISOString()
			});

			window.umami?.track('Essential Data Download');
		} catch (error) {
			console.warn('Essential data download failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			isDownloadingEssential = false;
			downloadProgressPercentage = 100;
		}
	}

	// Delete essential data (core + chapter + juz)
	async function handleDeleteEssentialData() {
		try {
			// Delete chapter data
			await deleteSpecificCache('quranwbw-chapter-data');
			await clearDexieTable('quranwbw-chapter-data');
			updateOfflineSettingsStructure('chapterData', {
				downloaded: false,
				downloadedAt: null
			});

			// Delete juz data
			await deleteSpecificCache('quranwbw-juz-data');
			await clearDexieTable('quranwbw-juz-data');
			updateOfflineSettingsStructure('juzData', {
				downloaded: false,
				downloadedAt: null
			});

			// Delete core data
			await unregisterServiceWorkerAndClearCache();
			offlineModeSettings = {};
			updateSettings({ type: 'offlineModeSettings', value: offlineModeSettings });

			window.umami?.track('Essential Data Delete');
		} catch (error) {
			console.warn('Essential data delete failed:', error);
			showAlert(errorAlertMessage, '');
		}
	}

	// Delete specific cache data
	async function handleDeleteSpecificData(cacheName, objectName) {
		try {
			// 1. Remove cached data
			await Promise.all([deleteSpecificCache(cacheName), clearDexieTable(cacheName)]);

			// 2. Update offline download state
			updateOfflineSettingsStructure(objectName, {
				downloaded: false,
				downloadedAt: null
			});

			const downloadedDataSettings = offlineModeSettings.downloadedDataSettings;

			// 3. Handle related settings cleanup
			switch (objectName) {
				case 'tafsirData': {
					downloadedDataSettings.tafsirs = [];
					break;
				}

				case 'chapterData':
				case 'juzData': {
					// Clear shared text-related data only if both are deleted
					if (!isChapterDataDownloaded && !isJuzDataDownloaded) {
						downloadedDataSettings.fontTypes = [];
						downloadedDataSettings.wordTranslations = [];
						downloadedDataSettings.wordTransliterations = [];
						downloadedDataSettings.verseTranslations = [];
					}
					break;
				}

				case 'mushafData': {
					// Remove Mushaf-specific font types (2 and 3)
					downloadedDataSettings.fontTypes = (downloadedDataSettings.fontTypes || []).filter((fontId) => fontId !== 2 && fontId !== 3);
					break;
				}
			}

			// Clears all downloadedDataSettings arrays if no offline data is marked as downloaded
			await clearDownloadedDataSettingsIfNoOfflineData();

			// 4. Persist updated settings
			updateSettings({
				type: 'offlineModeSettings',
				value: offlineModeSettings
			});
		} catch (error) {
			console.warn('Delete specific cache failed:', error);
			showAlert(errorAlertMessage, '');
		}
	}

	// Clears all downloadedDataSettings arrays if no content offline data is downloaded
	async function clearDownloadedDataSettingsIfNoOfflineData() {
		try {
			if (!offlineModeSettings?.downloadedDataSettings) return;

			console.log('running clearDownloadedDataSettingsIfNoOfflineData');

			// Dynamically detect all content-related offline data keys
			const offlineContentKeys = Object.keys(offlineModeSettings).filter((key) => key !== 'serviceWorker' && key !== 'downloadedDataSettings' && typeof offlineModeSettings[key] === 'object' && Object.prototype.hasOwnProperty.call(offlineModeSettings[key], 'downloaded'));

			// Check if any content data is still downloaded
			const hasAnyContentDownloaded = offlineContentKeys.some((key) => offlineModeSettings[key]?.downloaded === true);

			if (hasAnyContentDownloaded) return;

			// Delete and reset everything
			await unregisterServiceWorkerAndClearCache();
			$__offlineModeSettings = {};
			updateSettings({ type: 'offlineModeSettings', value: {} });
		} catch (error) {
			console.warn('Failed to clear downloadedDataSettings:', error);
		}
	}

	// Redownload specific data (deletes and reinstalls)
	async function handleRedownloadData(dataType) {
		try {
			switch (dataType) {
				case 'chapterData':
					await handleDeleteSpecificData('quranwbw-chapter-data', 'chapterData');
					await handleDownloadChaptersData();
					break;

				case 'juzData':
					await handleDeleteSpecificData('quranwbw-juz-data', 'juzData');
					await handleDownloadJuzData();
					break;

				case 'mushafData':
					await handleDeleteSpecificData('quranwbw-mushaf-data', 'mushafData');
					await handleDownloadMushafData();
					break;

				case 'morphologyData':
					await handleDeleteSpecificData('morphology_data', 'morphologyData');
					await handleDownloadMorphologyData();
					break;

				case 'tafsirData':
					await handleDeleteSpecificData('tafsir_data', 'tafsirData');
					await handleDownloadTafsirData();
					break;

				case 'essentialData':
					await handleDeleteEssentialData();
					await handleDownloadEssentialData();
					break;

				default:
					console.warn('Unknown data type:', dataType);

					window.umami?.track(`Data Re-download: ${dataType}`);
			}
		} catch (error) {
			console.warn('Redownload failed:', error);
			showAlert(errorAlertMessage, '');
		} finally {
			window.umami?.track(`Data Re-download: ${dataType}`);
		}
	}

	// Cache all 114 chapter routes and download chapter data
	async function handleDownloadChaptersData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingChapter = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('chapterData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalChapters + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded first
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			const chapterRoutes = Array.from({ length: totalChapters }, (_, i) => `/${i + 1}`);
			for (const route of chapterRoutes) {
				await cacheUrlToCache(route, 'quranwbw-chapter-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

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

	// Cache all 30 juz routes and download juz data
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
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalJuz + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded first
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			const juzRoutes = Array.from({ length: totalJuz }, (_, i) => `/juz/${i + 1}`);
			for (const route of juzRoutes) {
				await cacheUrlToCache(route, 'quranwbw-juz-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

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

	// Cache all 604 mushaf pages and fonts
	async function handleDownloadMushafData() {
		if (!(await checkOnlineAndAlert())) return;

		isDownloadingMushaf = true;
		downloadProgressPercentage = 0;

		ensureOfflineSettingsStructure('mushafData', {
			downloaded: false,
			downloadedAt: null
		});

		try {
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalPages * 2 + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded first
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			for (let page = 1; page <= totalPages; page++) {
				await cacheUrlToCache(`/page/${page}`, 'quranwbw-mushaf-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

				await cacheUrlToCache(getMushafWordFontLink(page), 'quranwbw-mushaf-data');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			await downloadChapterAndVerseTranslationData({ fontType: [2, 3] });
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

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
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalChapters + 4 + 1 + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded first
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				await fetchAndCacheJson(morphologyDataUrls.getWordSummary(chapter), 'morphology');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

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

			await downloadChapterAndVerseTranslationData({});
			completedStepsInDownloadProgress++;
			updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);

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
			const coreSteps = isServiceWorkerRegistered ? 0 : 4;
			const totalStepsInDownloadProgress = coreSteps + totalChapters + 1;
			let completedStepsInDownloadProgress = 0;

			// Ensure core is downloaded first
			await ensureCoreDataDownloaded(() => {
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			});

			const selectedTafirId = $__verseTafsir || 30;
			const selectedTafsir = selectableTafsirs[selectedTafirId];

			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				await fetchAndCacheJson(`${tafsirDataUrls[selectedTafsir.url]}/${selectedTafsir.slug}/${chapter}.json`, 'tafsir');
				completedStepsInDownloadProgress++;
				updateDownloadProgress(completedStepsInDownloadProgress, totalStepsInDownloadProgress);
			}

			// Track downloaded tafsir
			addDownloadedDataSettings({
				tafsir: selectedTafirId
			});

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
			const cachePromises = Object.entries(cdnStaticDataUrls).map(([_, url]) => {
				return fetchAndCacheJson(url, 'other');
			});

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

	<!-- Basic Data Download Option and Advanced Data Download Toggle -->
	<div class="my-8 flex flex-col space-y-6 md:flex-row md:space-x-6 md:space-y-0 overflow-auto">
		<!-- Basic Data Download -->
		<div class="flex flex-col flex-1 space-y-2 text-sm {isDownloading && !isDownloadingEssential && disabledClasses}">
			<div class="flex flex-row justify-between">
				<div>
					<span class={window.theme('textSecondary')}>Essential Offline Data</span>
					<span class="opacity-70"> (~20 MB)</span>
				</div>
				<span class="px-2 py-1 rounded-full text-xs h-max {window.theme('textSecondary')} {window.theme('bgSecondaryLight')}">Recommended</span>
			</div>

			<div class="flex flex-col flex-1 space-y-4">
				<div class="text-sm mb-auto">
					This will download the essential files needed to use the website offline. It includes the main website files, all 114 {term('chapters')}, and all 30 {term('juzs')}.
				</div>

				<button class="text-sm space-x-2 h-max {buttonClasses}" on:click={isServiceWorkerRegistered && isChapterDataDownloaded && isJuzDataDownloaded ? showConfirm('This will delete the essential offline data.', '', handleDeleteEssentialData) : handleDownloadEssentialData} disabled={isDownloading}>
					{#if isServiceWorkerRegistered && isChapterDataDownloaded && isJuzDataDownloaded}
						<Trash size={4} />
						<span>Delete</span>
					{:else if isDownloadingEssential}
						<Spinner size="5" inline={true} hideMessages={true} />
						<span>{downloadProgressPercentage}%</span>
					{:else}
						<Download size={4} />
						<span>Download</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Vertical divider -->
		<div class="hidden md:block w-px {window.theme('bgSecondaryExtraDark')}"></div>

		<!-- Advanced Data Download Toggle -->
		<div class="flex flex-col flex-1 space-y-2 text-sm">
			<div class={window.theme('textSecondary')}>Advanced Data Download</div>

			<div class="flex flex-col flex-1 space-y-4">
				<div class="text-sm mb-auto">
					This section lets you choose exactly what you want to download. You can download or remove specific data like {term('chapters')}, {term('juzs')}, Mushaf pages,
					{term('tafsir')}, or Morphology, based on your needs.
				</div>

				<button class="text-sm space-x-2 h-max {buttonClasses}" on:click={() => (showAdvancedDownloadOptions = !showAdvancedDownloadOptions)} disabled={isDownloading}>
					<svelte:component this={showAdvancedDownloadOptions ? EyeCrossed : Eye} size={4} />
					<span>{showAdvancedDownloadOptions ? 'Disable Options' : 'Enable Options'}</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Individual Download Options -->
	<div class="my-6 flex flex-col space-y-4 overflow-auto {!showAdvancedDownloadOptions && disabledClasses}">
		{#each dataSections as section, index}
			<!-- Data Section -->
			<div class="flex flex-col space-y-2 text-sm {(isDownloading && !section.isDownloading) || (section.isSectionDisabled && section.isSectionDisabled()) ? disabledClasses : ''}">
				<div>
					<span class={window.theme('textSecondary')}>{section.title}</span>
					<span class="opacity-70"> ({section.sizeLabel})</span>
				</div>

				<!-- Mismatch banner with re-download button -->
				{#if section.isDataDownloaded && section.showMismatchBanner}
					<div class="mt-4 p-3 rounded-md flex flex-row space-x-1 items-start text-sm {window.theme('bgSecondaryLight')}">
						<span class="flex-shrink-0 w-5 h-5 mt-1 md:mt-0.5"><Info /></span>
						<span>{mismatchMessage}</span>
					</div>
				{/if}

				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div class="text-sm">{section.description}</div>

					<div class="flex flex-row space-x-2">
						{#if section.isDataDownloaded}
							<!-- Re-download button (only shown when data is downloaded) -->
							<button class="text-sm space-x-2 h-max whitespace-nowrap {buttonClasses}" on:click={section.onRedownload} disabled={isDownloading}>
								{#if section.isDownloading}
									<span>{downloadProgressPercentage}%</span>
								{:else}
									<Refresh size={4} />
								{/if}
							</button>

							<!-- Delete button (only shown when data is downloaded) -->
							<button class="text-sm space-x-2 h-max whitespace-nowrap {buttonClasses}" on:click={() => showConfirm('Are you sure you want to delete this data?', '', section.onDelete)} disabled={isDownloading}>
								<Trash size={4} />
							</button>
						{:else}
							<!-- Download button (only shown when data is NOT downloaded) -->
							<button class="text-sm space-x-2 h-max whitespace-nowrap {buttonClasses}" on:click={section.onDownload} disabled={isDownloading}>
								{#if section.isDownloading}
									<span>{downloadProgressPercentage}%</span>
								{:else}
									<Download size={4} />
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Divider (only between sections, not after the last one) -->
			{#if index < dataSections.length - 1}
				<div class="border-b {window.theme('border')}"></div>
			{/if}
		{/each}
	</div>
</div>
