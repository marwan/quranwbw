<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { buttonClasses } from '$data/commonClasses';
	import { __fontType, __wordTranslation, __wordTransliteration, __verseTranslations, __downloadModalVisible } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';
	import { updateSettings } from '$utils/updateSettings';

	let progressMessage = '';
	let downloading = false;

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

		progressMessage = 'Download complete! ✅';
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
</script>

<Modal id="downloadModal" bind:open={$__downloadModalVisible} transitionParams={getModalTransition('bottom')} size="xs" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-6 text-xl font-medium">Download</h3>

	<div class="flex flex-col space-y-4">
		<div id="current-settings">
			<div class="font-semibold">Your current settings</div>
			<div>Font Type: {$__fontType}</div>
			<div>Word Translation: {$__wordTranslation}</div>
			<div>Word Transliteration: {$__wordTransliteration}</div>
			<div>Verse Translations: {$__verseTranslations.toString()}</div>
		</div>

		<button class={buttonClasses} on:click={downloadAllChapters} disabled={downloading}>
			{downloading ? 'Downloading...' : 'Download'}
		</button>
		<span id="progress-message">{progressMessage}</span>
	</div>
</Modal>
