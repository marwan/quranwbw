<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Info from '$svgs/Info.svelte';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
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
	let messageTimeout;

	$: wordTranslationKey = Object.keys(selectableWordTranslations).find((key) => selectableWordTranslations[key].id === $__wordTranslation);
	$: wordTransliterationKey = Object.keys(selectableWordTransliterations).find((key) => selectableWordTransliterations[key].id === $__wordTransliteration);

	/**
	 * Check if user settings have changed compared to previously downloaded data.
	 */
	$: {
		const savedSettings = $__downloadedDataInfo;
		if (savedSettings?.allChaptersDownloaded) {
			settingsChanged = savedSettings.fontType !== $__fontType || savedSettings.wordTranslation !== $__wordTranslation || savedSettings.wordTransliteration !== $__wordTransliteration || JSON.stringify(savedSettings.verseTranslations) !== JSON.stringify($__verseTranslations);
		} else {
			settingsChanged = false;
		}
	}

	/**
	 * Displays a message and ensures it disappears after a few seconds.
	 */
	function showMessage(message) {
		progressMessage = message;

		// Clear any existing timeout before setting a new one
		if (messageTimeout) clearTimeout(messageTimeout);

		// Hide the message after 5 seconds
		messageTimeout = setTimeout(() => {
			progressMessage = '';
		}, 2000);
	}

	/**
	 * Downloads all chapters and updates settings.
	 */
	async function downloadAllChapters() {
		if (downloading) return;
		downloading = true;
		showMessage('Starting download...');

		await db.api_data.clear(); // Clear old cached data

		const totalChapters = 5; // Change to 114 for full Quran
		let completed = 0;

		try {
			for (let chapter = 1; chapter <= totalChapters; chapter++) {
				await fetchChapterData({ chapter, skipSave: true });
				await fetchVerseTranslationData({ chapter, skipSave: true });

				completed++;
				showMessage(`Downloading... ${Math.round((completed / totalChapters) * 100)}%`);
			}

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
		} catch (error) {
			console.error('Download failed:', error);
			showMessage('Error downloading data.');
		} finally {
			downloading = false;
		}
	}

	/**
	 * Deletes all stored data from IndexedDB and resets settings.
	 */
	async function deleteApiDataTable() {
		try {
			await db.api_data.clear(); // Clear the database
			showMessage('Data deleted!');

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
</script>

<Modal id="downloadModal" bind:open={$__downloadModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-4 text-xl font-medium">Download</h3>

	<div class="flex flex-col space-y-4 text-sm">
		<p>You can download the basic chapter data based on your preferred settings. Once downloaded, the chapter page will be accessible offline unless the data is deleted.</p>

		<div>
			<div>Font Type: {selectableFontTypes[$__fontType].font}</div>
			<div>Word Translation: {selectableWordTranslations[wordTranslationKey]?.language || 'N/A'}</div>
			<div>Word Transliteration: {selectableWordTransliterations[wordTransliterationKey]?.language || 'N/A'}</div>
			<div>Verse Translations: {$__verseTranslations.length ? $__verseTranslations.toString() : 'None'}</div>

			<div>
				Last Download:
				{#if !$__downloadedDataInfo.lastDownloadAt}
					Never
				{:else}
					{timeAgo($__downloadedDataInfo.lastDownloadAt) || 'Just Now'}
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

		<!-- Buttons for Download and Delete -->
		<div class="flex flex-row space-x-2 w-full !mt-6 {downloading && disabledClasses}">
			<button class="{buttonClasses} w-full" on:click={downloadAllChapters} disabled={downloading}>
				{$__downloadedDataInfo.allChaptersDownloaded ? 'Download Again' : 'Download Data'}
			</button>

			{#if $__downloadedDataInfo.allChaptersDownloaded}
				<button class="{buttonClasses} w-full" on:click={deleteApiDataTable}> Delete Data </button>
			{/if}
		</div>
	</div>
</Modal>
