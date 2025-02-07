<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { __fontType, __wordTranslation, __wordTransliteration, __verseTranslations, __downloadModalVisible, __downloadedDataInfo } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';
	import { updateSettings } from '$utils/updateSettings';
	import { timeAgo } from '$utils/timeAgo';
	import { selectableFontTypes, selectableWordTranslations, selectableWordTransliterations, selectableVerseTransliterations } from '$data/options';
	import { db } from '$lib/db';

	let progressMessage = '';
	let downloading = false;

	$: wordTranslationKey = Object.keys(selectableWordTranslations).find((item) => selectableWordTranslations[item].id === $__wordTranslation);
	$: wordTransliterationKey = Object.keys(selectableWordTransliterations).find((item) => selectableWordTransliterations[item].id === $__wordTransliteration);

	// Function to download and store data from API
	async function downloadAllChapters() {
		if (downloading) return; // Prevent multiple clicks
		downloading = true;
		progressMessage = 'Starting download...';

		const totalChapters = 5;
		let completed = 0;

		for (let chapter = 1; chapter <= totalChapters; chapter++) {
			await fetchChapterData({ chapter, skipSave: true });
			await fetchVerseTranslationData({ chapter, skipSave: true });

			completed++;
			progressMessage = `Downloading... ${Math.round((completed / totalChapters) * 100)}%`;
		}

		progressMessage = 'Download complete!';
		downloading = false;

		updateSettings({
			type: 'downloadedDataInfo',
			value: {
				allChaptersDownloaded: true,
				fontType: $__fontType,
				wordTranslation: $__wordTranslation,
				wordTransliteration: $__wordTransliteration,
				verseTranslations: $__verseTranslations,
				lastDownloadAt: new Date().toISOString()
			}
		});
	}

	// Function to delete the entire "api_data" table
	async function deleteApiDataTable() {
		try {
			await db.api_data.clear(); // Clears all records from api_data
			progressMessage = 'Offline data deleted.';

			updateSettings({
				type: 'downloadedDataInfo',
				value: {}
			});
		} catch (error) {
			console.error('Error deleting api_data:', error);
			progressMessage = 'Error deleting data.';
		}
	}
</script>

<Modal id="downloadModal" bind:open={$__downloadModalVisible} transitionParams={getModalTransition('bottom')} size="xs" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-4 text-xl font-medium">Download</h3>

	<div>You can download the basic chapter data based on your preferred settings. Once downloaded, the chapter page will be accessible offline unless the data is deleted.</div>

	<div class="flex flex-col space-y-4 mt-4">
		<div id="current-settings">
			<div class="font-semibold">Your Settings:</div>
			<div>Font Type: {selectableFontTypes[$__fontType].font}</div>
			<div>Word Translation: {selectableWordTranslations[wordTranslationKey].language}</div>
			<div>Word Transliteration: {selectableWordTransliterations[wordTransliterationKey].language}</div>
			<div>Verse Translations/Transliterations: {$__verseTranslations.length === 0 ? 'None' : $__verseTranslations.toString()}</div>
			<div>
				Last Download:

				{#if !$__downloadedDataInfo.hasOwnProperty('lastDownloadAt')}
					Never
				{:else if timeAgo($__downloadedDataInfo.lastDownloadAt) === undefined}
					Just Now
				{:else}
					{timeAgo($__downloadedDataInfo.lastDownloadAt)}
				{/if}
			</div>
		</div>

		<span id="progress-message">{progressMessage}</span>

		<div class="flex flex-row space-x-2 w-full {downloading && disabledClasses}">
			<button class="{buttonClasses} w-full" on:click={downloadAllChapters} disabled={downloading}>
				{#if $__downloadedDataInfo.hasOwnProperty('allChaptersDownloaded')}
					Download Again
				{:else}
					Download Data
				{/if}
			</button>

			{#if $__downloadedDataInfo.hasOwnProperty('allChaptersDownloaded')}
				<button class="{buttonClasses} w-full" on:click={deleteApiDataTable}> Delete Data </button>
			{/if}
		</div>
	</div>
</Modal>
