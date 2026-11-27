<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import VerseTranslations from '$display/verses/VerseTranslations.svelte';
	import ArabicVerseWords from '$display/verses/ArabicVerseWords.svelte';
	import { __currentPage, __verseTranslationModalVisible, __chapterData, __verseKey } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { getModalTransition } from '$utils/getModalTransition';

	let chapterData;
	$: chapter = +$__verseKey.split(':')[0];
	$: verse = +$__verseKey.split(':')[1];
	$: if ($__verseTranslationModalVisible) chapterData = $__currentPage === 'mushaf' ? JSON.parse(localStorage.getItem('pageData')) : $__chapterData;
</script>

<Modal id="verseTranslationModal" bind:open={$__verseTranslationModalVisible} transitionParams={getModalTransition('bottom')} size="lg" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">{quranMetaData[chapter].transliteration}, {chapter}:{verse}</h3>

	<div class="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full pr-2">
		<div class="flex flex-col space-y-4">
			<div class="py-4">
				<ArabicVerseWords key={$__verseKey} />
			</div>

			<VerseTranslations value={chapterData[$__verseKey]} />
		</div>
	</div>
</Modal>
