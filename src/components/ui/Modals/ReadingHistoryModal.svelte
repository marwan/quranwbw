<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __readingHistory } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { term } from '$utils/terminologies';
	import { individualCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';

	export let open = false;
</script>

<Modal id="readingHistoryModal" bind:open transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 id="reading-history-modal-title" class="mb-6 text-xl font-medium flex-shrink-0">Last read history</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid gap-3 w-full p-2">
			{#each $__readingHistory as item (item.id)}
				<a href={`/${item.chapter}?startVerse=${item.verse}`} class="{individualCheckboxClasses} flex items-center gap-3 w-full min-w-0 overflow-hidden" on:click={() => (open = false)}>
					<div class="flex-1 min-w-0 overflow-hidden">
						<div class="line-clamp-1">
							{item.chapter}. {quranMetaData[item.chapter].transliteration}
						</div>

						<div class="text-xs opacity-70">
							{term('verse')}
							{item.verse}
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
