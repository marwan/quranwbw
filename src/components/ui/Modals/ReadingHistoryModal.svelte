<script>
	export let open = false;

	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __currentPage, __readingHistoryModalVisible, __readingHistory } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { individualCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';

	let fullQuranTextData = null;

	// Automatically close the modal whenever the user navigates to a new page
	$: if ($__currentPage) __readingHistoryModalVisible.set(false);

	// Load the full Quran text when the reading history modal is opened
	$: if ($__readingHistoryModalVisible) loadQuranData();

	// Load and cache the full Quran text data
	async function loadQuranData() {
		try {
			fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, 'other');
		} catch (error) {
			console.warn(error);
		}
	}
</script>

<Modal id="readingHistoryModal" bind:open={$__readingHistoryModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">Reading History</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid gap-3 w-full">
			{#each $__readingHistory as item, index (item.id)}
				{@const [chapter, verse] = [item.chapter, item.verse]}

				<a href={`/${chapter}?startVerse=${verse}`} class="{individualCheckboxClasses} flex items-center gap-3 w-full min-w-0 overflow-hidden" on:click={() => (open = false)}>
					<div class="flex-1 min-w-0 overflow-hidden">
						<div class="line-clamp-1">
							{index + 1}. {quranMetaData[chapter].transliteration} ({chapter}:{verse})
						</div>

						<!-- Show the complete verse text -->
						{#if fullQuranTextData}
							<div class="text-md truncate text-right direction-rtl arabic-font-1 opacity-70 mt-2">
								{#await fullQuranTextData then data}
									{#if data}
										{@const verseText = data.data[`${chapter}:${verse}`]}
										<div class="truncate" lang="ar">
											{verseText}
										</div>
									{/if}
								{/await}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
</Modal>
