<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Info from '$svgs/Info.svelte';
	import { buttonClasses } from '$data/commonClasses';
	import { __fontType, __wordTranslation, __wordTransliteration, __verseTranslations, __downloadModalVisible, __downloadedDataInfo } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';
	import { updateSettings } from '$utils/updateSettings';
	import { timeAgo } from '$utils/timeAgo';
	import { selectableFontTypes, selectableWordTranslations, selectableWordTransliterations } from '$data/options';
	import { apiVersion } from '$data/websiteSettings';
	import { db } from '$lib/db';

	// State variables
	let progressMessage = '';
	let downloading = false;
	let settingsChanged = false;
	let abortController = null; // Used for stopping downloads
	let downloadStopped = false;
	let swRegistered = null; // Store to track service worker status

	$: wordTranslationKey = Object.keys(selectableWordTranslations).find((key) => selectableWordTranslations[key].id === $__wordTranslation);
	$: wordTransliterationKey = Object.keys(selectableWordTransliterations).find((key) => selectableWordTransliterations[key].id === $__wordTransliteration);
	$: if ($__downloadModalVisible) {
		progressMessage = '';
		checkServiceWorker();
	}

	// Check if user settings have changed compared to previously downloaded data.
	$: {
		const savedSettings = $__downloadedDataInfo;
		if (savedSettings?.allChaptersDownloaded) {
			settingsChanged = savedSettings.fontType !== $__fontType || savedSettings.wordTranslation !== $__wordTranslation || savedSettings.wordTransliteration !== $__wordTransliteration || JSON.stringify(savedSettings.verseTranslations) !== JSON.stringify($__verseTranslations);
		} else {
			settingsChanged = false;
		}
	}

	// Displays a message and ensures it disappears **only after the whole download completes**.
	function showMessage(message) {
		progressMessage = message;
	}

	// Stops the ongoing download by aborting all network requests.
	function stopDownload() {
		if (abortController) {
			abortController.abort(); // Abort ongoing requests
			abortController = null;
		}
		downloading = false;
		downloadStopped = true;
		showMessage('Download stopped!');
	}

	// Downloads all chapters and updates settings.
	async function downloadAllChapters() {
		if (downloading) return;
		downloading = true;
		downloadStopped = false;
		showMessage('Starting download...');
		abortController = new AbortController();

		await db.api_data.clear(); // Clear old cached data

		const totalChapters = 114;
		let completed = 0;

		try {
			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				// Stop the loop if download is cancelled
				if (!downloading || !abortController) break;

				await fetch(`/${chapter}`);
				await fetchChapterData({ chapter, skipSave: true, signal: abortController.signal });
				await fetchVerseTranslationData({ chapter, skipSave: true, signal: abortController.signal });

				completed++;

				if (!downloadStopped) {
					progressMessage = `Downloading... ${Math.round((completed / totalChapters) * 100)}%`;
				}
			}

			if (downloading) {
				// Update settings after successful download
				updateSettings({
					type: 'downloadedDataInfo',
					value: {
						allChaptersDownloaded: true,
						fontType: $__fontType,
						wordTranslation: $__wordTranslation,
						wordTransliteration: $__wordTransliteration,
						verseTranslations: $__verseTranslations,
						lastDownloadAt: new Date().toISOString(),
						apiVersion
					}
				});
				showMessage('Download complete!');
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				showMessage('Download stopped!');
			} else {
				if (downloadStopped) {
					downloadStopped = false;
				} else {
					console.error('Download failed:', error);
					showMessage('Error downloading data.');
				}
			}
		} finally {
			downloading = false;
			abortController = null;
		}
	}

	// Deletes all stored data from IndexedDB and resets settings.
	async function deleteApiDataTable() {
		try {
			await db.api_data.clear(); // Clear the database
			showMessage('Data deleted!');
			downloadStopped = false;

			// Reset stored settings
			updateSettings({
				type: 'downloadedDataInfo',
				value: {}
			});
		} catch (error) {
			console.error('Error deleting api_data:', error);
			showMessage('Error deleting data.');
		}
	}

	// Checks if service worker is enabled or not
	async function checkServiceWorker() {
		if ('serviceWorker' in navigator) {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();
				swRegistered = registrations.length > 0;
			} catch (error) {
				swRegistered = false;
			}
		} else {
			swRegistered = false;
		}
	}
</script>

<Modal id="downloadModal" bind:open={$__downloadModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-4 text-xl font-medium">Offline Mode</h3>

	<div class="flex flex-col space-y-4 text-sm">
		<p>By default, the website caches pages as you browse. However, you can use this feature to download chapter data all at once based on your settings. Once downloaded, the chapter page will remain accessible offline unless deleted.</p>

		<div>
			<div>Font Type: {selectableFontTypes[$__fontType].font}</div>
			<div>Word Translation: {selectableWordTranslations[wordTranslationKey]?.language || 'N/A'}</div>
			<div>Word Transliteration: {selectableWordTransliterations[wordTransliterationKey]?.language || 'N/A'}</div>
			<div>Verse Translations/Transliterations: {$__verseTranslations.length ? `${$__verseTranslations.length} Selected` : 'None'}</div>

			<div>
				Last Download:
				{#if !$__downloadedDataInfo.lastDownloadAt}
					Never
				{:else}
					{timeAgo($__downloadedDataInfo.lastDownloadAt) || 'Just Now'}
				{/if}
			</div>

			<div>
				Service Worker Registered:
				{#if swRegistered === null}
					Checking...
				{:else}
					{swRegistered ? 'Yes' : 'No'}
				{/if}
			</div>
		</div>

		{#if $__downloadedDataInfo.apiVersion}
			{#if $__downloadedDataInfo.apiVersion !== apiVersion}
				<div class="p-3 rounded-md flex flex-row space-x-2 items-center {window.theme('bgSecondaryLight')}">
					<Info />
					<span>Your current downloaded data is outdated.</span>
				</div>
			{/if}
		{/if}

		{#if settingsChanged}
			<div class="p-3 rounded-md flex flex-row space-x-2 items-center {window.theme('bgSecondaryLight')}">
				<Info />
				<span>Your settings were changed since the last download.</span>
			</div>
		{/if}

		{#if progressMessage}
			<div id="progress-message" class="font-medium">{progressMessage}</div>
		{/if}

		<!-- Buttons for Download, Stop, and Delete -->
		<div class="flex flex-row space-x-2 w-full !mt-6">
			{#if downloading}
				<button class="{buttonClasses} w-full truncate" on:click={stopDownload}> Stop Download </button>
			{:else}
				<button class="{buttonClasses} w-full truncate" on:click={downloadAllChapters} disabled={downloading}>
					{$__downloadedDataInfo.allChaptersDownloaded ? 'Download Again' : 'Download Data'}
				</button>

				{#if $__downloadedDataInfo.allChaptersDownloaded}
					<button class="{buttonClasses} w-full truncate" on:click={deleteApiDataTable}> Delete Data </button>
				{/if}
			{/if}
		</div>
	</div>
</Modal>
