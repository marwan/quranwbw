<script>
	import PageHead from '$misc/PageHead.svelte';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { __currentPage, __offlineModeSettings } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';

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
	// ensureOfflineSettingsStructure('chapterData', { downloaded: false, downloadedAt: null, chapters: [] });
	// ensureOfflineSettingsStructure('mushafData', { downloaded: false, downloadedAt: null, fonts: [] });

	// Reactive statement for local reference
	$: offlineModeSettings = $__offlineModeSettings;

	$: isServiceWorkerRegistered = offlineModeSettings?.serviceWorker?.downloaded ?? false;

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

		if (!result.success) {
			alert('Failed to enable offline mode: ' + result.error);
			isRegistering = false;
		}
	}

	async function handleUnregister() {
		await unregisterServiceWorkerAndClearCache();

		// Update using helper function
		updateOfflineSettingsStructure('serviceWorker', {
			downloaded: false,
			downloadedAt: null
		});
	}

	// Example functions for future features:

	// async function handleDownloadChapters(chapterList) {
	// 	ensureOfflineSettingsStructure('chapterData', { downloaded: false, downloadedAt: null, chapters: [] });
	//
	// 	// ... download logic ...
	//
	// 	updateOfflineSettingsStructure('chapterData', {
	// 		downloaded: true,
	// 		downloadedAt: new Date().toISOString(),
	// 		chapters: chapterList
	// 	});
	// }

	// async function handleDownloadMushafFonts(fontList) {
	// 	ensureOfflineSettingsStructure('mushafData', { downloaded: false, downloadedAt: null, fonts: [] });
	//
	// 	// ... download logic ...
	//
	// 	updateOfflineSettingsStructure('mushafData', {
	// 		downloaded: true,
	// 		downloadedAt: new Date().toISOString(),
	// 		fonts: fontList
	// 	});
	// }

	__currentPage.set('offline');
</script>

<PageHead title={'Offline Mode'} />

<div class="mx-auto">
	<div class="markdown mx-auto">
		<h3>Offline Mode</h3>
		<p>In case you wish to use QuranWBW in offline mode, you can enable offline caching from this page. When enabled, parts of the website will be saved on your device, allowing you to access them even without an internet connection. This feature is completely optional, and any offline data can be updated or cleared at any time.</p>
	</div>

	<div class="mt-6 overflow-auto">
		<table class="w-full text-sm text-left rounded-md">
			<!-- <thead class="text-xs uppercase {window.theme('bgSecondaryLight')}">
				<tr>
					<th class="px-3 py-3">Resource</th>
					<th class="px-3 py-3 text-right">Action</th>
				</tr>
			</thead> -->
			<tbody>
				<!-- Service Worker & Core Files -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')}">
					<td class="py-4">
						<div class="font-semibold">Core Website Files</div>
						<div class="text-sm mt-1">Essential files required for offline access including all pages, chapters, and juz</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={isServiceWorkerRegistered ? showConfirm('Are you sure you want to delete this data?', '', () => handleUnregister()) : handleRegister} disabled={isRegistering || isDownloading}>
							{#if isServiceWorkerRegistered}
								<Trash size={4} />
							{:else}
								<Download size={4} />
							{/if}

							<span>
								{#if isServiceWorkerRegistered}
									Delete
								{:else if isRegistering}
									Downloading...
								{:else}
									Download
								{/if}
							</span>
						</button>
					</td>
				</tr>

				<!-- Mushaf Fonts -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Mushaf Quran Fonts (comming soon)</div>
						<div class="text-sm mt-1">High-quality fonts for displaying the Quran in traditional Mushaf style</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>

				<!-- Additional Translations -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Additional Translations (comming soon)</div>
						<div class="text-sm mt-1">Extra translations in various languages for offline reading</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>

				<!-- Audio Recitations -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Audio Recitations (comming soon)</div>
						<div class="text-sm mt-1">Download recitations by various Qaris for offline listening</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
