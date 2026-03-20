<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import NumberStar from '$display/NumberStar.svelte';
	import Star from '$svgs/Star.svelte';
	import StarFilled from '$svgs/StarFilled.svelte';
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { __favoriteSurahsModalVisible, __userFavoriteChapters } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';

	const surahGridClasses = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3';
	const surahCardClasses = `relative flex justify-between text-left rounded-xl p-5 transition ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')} ${window.theme('hover')}`;

	function toggleFavoriteChapter(chapterId) {
		window.umami?.track('Favorite Surah Button');
		updateSettings({ type: 'userFavoriteChapters', key: chapterId });
	}
</script>

<Modal id="favoriteSurahsModal" bind:open={$__favoriteSurahsModalVisible} title="Manage Surahs" transitionParams={getModalTransition('bottom')} size="xl" class="!rounded-b-none md:!rounded-3xl md:max-w-6xl" bodyClass="p-6 md:p-8 space-y-4 flex-1 overflow-y-auto overscroll-contain !border-t-0" headerClass="flex justify-between items-center p-6 rounded-t-3xl" position="bottom" center outsideclose>
	<div class={surahGridClasses}>
		{#each quranMetaData.slice(1) as chapter (chapter.id)}
			{@const isFavorite = $__userFavoriteChapters.includes(chapter.id)}
			<button type="button" class={surahCardClasses} aria-label={isFavorite ? `Remove ${chapter.transliteration} from favorites` : `Add ${chapter.transliteration} to favorites`} on:click={() => toggleFavoriteChapter(chapter.id)}>
				<div class="flex flex-row space-x-2 min-w-0">
					<div class="flex items-center shrink-0">
						<NumberStar value={chapter.id} />
					</div>

					<div class="min-w-0 text-left">
						<div class="flex items-center space-x-1 truncate pr-10">
							<div class="truncate">{chapter.transliteration}</div>
							<div><svelte:component this={chapter.revelation === 1 ? Mecca : Madinah} /></div>
						</div>
						<div class="text-xs opacity-70 truncate">{chapter.translation}</div>
						<div class="text-xs opacity-70">
							{chapter.verses}
							{term('verses')}
						</div>
					</div>
				</div>

				<div class="flex items-center gap-4 shrink-0">
					<div class="chapter-icons text-5xl" style="color: {window.theme('icon')}">
						{@html `&#xE9${chapter.icon};`}
					</div>
					<div class="text-3xl md:text-4xl" style="color: {window.theme('icon')}">
						<svelte:component this={isFavorite ? StarFilled : Star} size={5} />
					</div>
				</div>
			</button>
		{/each}
	</div>
</Modal>
