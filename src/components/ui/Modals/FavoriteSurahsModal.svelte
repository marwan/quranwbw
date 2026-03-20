<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import NumberStar from '$display/NumberStar.svelte';
	import Star from '$svgs/Star.svelte';
	import StarFilled from '$svgs/StarFilled.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { individualCheckboxClasses, selectedRadioOrCheckboxClasses } from '$data/commonClasses';
	import { __favoriteSurahsModalVisible, __userFavoriteChapters } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { getModalTransition } from '$utils/getModalTransition';

	const surahListClasses = 'grid gap-3 w-full';

	function toggleFavoriteChapter(chapterId) {
		window.umami?.track('Favorite Surah Button');
		updateSettings({ type: 'userFavoriteChapters', key: chapterId });
	}
</script>

<Modal id="favoriteSurahsModal" bind:open={$__favoriteSurahsModalVisible} title="Manage Surahs" transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class={surahListClasses}>
		{#each quranMetaData.slice(1) as chapter (chapter.id)}
			{@const isFavorite = $__userFavoriteChapters.includes(chapter.id)}
			<button
				type="button"
				class="{individualCheckboxClasses} {isFavorite ? selectedRadioOrCheckboxClasses : ''}"
				aria-label={isFavorite ? `Remove ${chapter.transliteration} from favorites` : `Add ${chapter.transliteration} to favorites`}
				on:click={() => toggleFavoriteChapter(chapter.id)}
			>
				<div class="flex items-center gap-3 min-w-0">
					<div class="flex items-center shrink-0 opacity-70">
						<NumberStar value={chapter.id} />
					</div>
					<div class="min-w-0 text-left">
						<div class="truncate">{chapter.transliteration}</div>
					</div>
				</div>

				<div class="flex items-center shrink-0" style="color: {window.theme('icon')}">
					<svelte:component this={isFavorite ? StarFilled : Star} size={5} />
				</div>
			</button>
		{/each}
		</div>
	</div>
</Modal>
