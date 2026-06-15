<script>
	export let open = false;

	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __currentPage, __readingHistoryModalVisible, __readingHistory } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { individualCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';

	// Automatically close the modal whenever the user navigates to a new page
	$: if ($__currentPage) __readingHistoryModalVisible.set(false);
</script>

<Modal id="readingHistoryModal" bind:open={$__readingHistoryModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 id="reading-history-modal-title" class="mb-6 text-xl font-medium flex-shrink-0">Reading History</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid gap-3 w-full">
			{#each $__readingHistory as item, index (item.id)}
				<a href={`/${item.chapter}?startVerse=${item.verse}`} class="{individualCheckboxClasses} flex items-center gap-3 w-full min-w-0 overflow-hidden" on:click={() => (open = false)}>
					<div class="flex-1 min-w-0 overflow-hidden">
						<div class="line-clamp-1">
							{index + 1}. {quranMetaData[item.chapter].transliteration} ({quranMetaData[item.chapter].translation})
						</div>
						<div class="text-sm opacity-60 mt-0.5">
							{item.chapter}:{item.verse}
						</div>
					</div>

					<div class="chapter-icons text-4xl hidden md:inline-flex flex-shrink-0 text-theme-accent">
						{@html `&#xE9${quranMetaData[item.chapter].icon};`}
					</div>
				</a>
			{/each}
		</div>
	</div>
</Modal>
