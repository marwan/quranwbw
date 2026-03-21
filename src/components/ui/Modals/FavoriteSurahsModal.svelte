<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __favoriteSurahsModalVisible, __userFavoriteChapters } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { getModalTransition } from '$utils/getModalTransition';
	import { term } from '$utils/terminologies';
	import { selectedRadioOrCheckboxClasses, individualCheckboxClasses } from '$data/commonClasses';

	function toggleFavoriteChapter(chapterId) {
		window.umami?.track('Add Surah To Favorite');
		updateSettings({ type: 'userFavoriteChapters', key: chapterId });
	}
</script>

<Modal id="favoriteSurahsModal" bind:open={$__favoriteSurahsModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-6 text-xl font-medium flex-shrink-0">Favorite {term('chapters')}</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid gap-3 w-full">
			{#each quranMetaData.slice(1) as chapter (chapter.id)}
				{@const isFavorite = $__userFavoriteChapters.includes(chapter.id)}
				<Checkbox name="favoriteChapter" checked={isFavorite} on:change={() => toggleFavoriteChapter(chapter.id)} custom>
					<div class="{individualCheckboxClasses} {isFavorite ? selectedRadioOrCheckboxClasses : ''}">
						<div class="truncate">{chapter.id}. {chapter.transliteration} ({chapter.translation})</div>
						<div class="chapter-icons justify-items-end text-4xl hidden md:inline-block" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[chapter.id].icon};`}</div>
					</div>
				</Checkbox>
			{/each}
		</div>
	</div>
</Modal>
