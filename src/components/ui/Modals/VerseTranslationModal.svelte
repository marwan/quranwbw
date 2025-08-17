<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import VerseTranslations from '$display/verses/VerseTranslations.svelte';
	import ArabicVerseWords from '$display/verses/ArabicVerseWords.svelte';
	import { __currentPage, __verseTranslationModalVisible, __chapterData, __verseKey } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';

	let chapterData;
	$: chapter = +$__verseKey.split(':')[0];
	$: verse = +$__verseKey.split(':')[1];
	$: if ($__verseTranslationModalVisible) chapterData = $__currentPage === 'mushaf' ? JSON.parse(localStorage.getItem('pageData')) : $__chapterData;
</script>

<Modal
	bind:open={$__verseTranslationModalVisible}
	title="{quranMetaData[chapter].transliteration}, {chapter}:{verse}"
	id="verseTranslationModal"
	class="!rounded-b-none md:!rounded-3xl"
	bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain border {window.theme('border')}"
	headerClass="flex justify-between items-center p-6 rounded-t-3xl"
	classFooter="rounded-b-3xl flex flex-row justify-between"
	size="lg"
	position="bottom"
	center
	outsideclose
>
	<div class="flex flex-col space-y-4">
		<div class="py-4">
			<ArabicVerseWords key={$__verseKey} />
		</div>

		<VerseTranslations value={chapterData[$__verseKey]} />
	</div>
</Modal>
