<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { buttonClasses } from '$data/commonClasses';
	import { __downloadModalVisible } from '$utils/stores';
	import { getModalTransition } from '$utils/getModalTransition';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';

	let progressMessage = '';
	let downloading = false;

	async function downloadAllChapters() {
		if (downloading) return; // Prevent multiple clicks
		downloading = true;
		progressMessage = 'Starting download...';

		const totalChapters = 114;
		let completed = 0;

		for (let chapter = 1; chapter <= totalChapters; chapter++) {
			await fetchChapterData({ chapter, skipSave: true });
			await fetchVerseTranslationData({ chapter, skipSave: true });

			completed++;
			progressMessage = `Downloading... ${Math.round((completed / totalChapters) * 100)}%`;
		}

		progressMessage = 'Download complete! ✅';
		downloading = false;
	}
</script>

<Modal id="downloadModal" bind:open={$__downloadModalVisible} transitionParams={getModalTransition('bottom')} size="xs" class="!rounded-b-none md:!rounded-3xl" bodyClass="p-6" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-8 text-xl font-medium">Download</h3>
	<button class={buttonClasses} on:click={downloadAllChapters} disabled={downloading}>
		{downloading ? 'Downloading...' : 'Download'}
	</button>
	<span id="progress-message">{progressMessage}</span>
</Modal>
