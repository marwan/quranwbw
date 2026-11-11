<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { __currentPage, __readingHistoryModalVisible, __readingHistory } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { individualCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { resumeReadingSession, getReadingHistoryEntryUrl, formatReadingHistoryDate } from '$utils/readingHistoryHandler';
	import { term } from '$utils/terminologies';
	import { updateSettings } from '$utils/updateSettings';

	let fullQuranTextData = null;

	// Automatically close the modal whenever the user navigates to a new page
	$: if ($__currentPage) __readingHistoryModalVisible.set(false);

	// Load the full Quran text when the reading history modal is opened
	$: if ($__readingHistoryModalVisible) loadQuranData();

	// Label of the view an entry was read in (chapter view has none)
	function getViewLabel(item) {
		if (item.currentPage === 'mushaf' && item.page) return `Page ${item.page}`;
		if (item.currentPage === 'juz' && item.juz) return `${term('juz')} ${item.juz}`;
		if (item.currentPage === 'hizb' && item.hizb) return `${term('hizb')} ${item.hizb}`;
		return null;
	}

	// Remove a single entry from the reading history
	function removeEntry(item) {
		updateSettings({ type: 'removeReadingHistoryEntry', value: item.id });
		window.rybbit?.event('Remove Reading History Entry');
	}

	// Load and cache the full Quran text data
	async function loadQuranData() {
		try {
			fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, 'other');
		} catch (error) {
			console.warn(error);
		}
	}
</script>

<Modal id="readingHistoryModal" bind:open={$__readingHistoryModalVisible} transitionParams={getModalTransition('bottom')} size="md" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">Reading History</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid gap-3 w-full">
			{#each $__readingHistory as item, index (item.id)}
				{@const [chapter, verse] = [item.chapter, item.verse]}
				{@const entryUrl = getReadingHistoryEntryUrl(item)}
				{@const viewLabel = getViewLabel(item)}
				{@const readDate = formatReadingHistoryDate(item.updatedAt)}

				<div class="{individualCheckboxClasses} flex items-stretch gap-3 w-full min-w-0 overflow-hidden">
					<a href={entryUrl} class="flex-1 min-w-0 overflow-hidden" on:click={() => resumeReadingSession(item.id, entryUrl)}>
						<div class="line-clamp-1">
							{index + 1}. {quranMetaData[chapter].transliteration} ({chapter}:{verse}){#if viewLabel}<span class="opacity-70 ml-1">· {viewLabel}</span>{/if}
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
					</a>

					<!-- Last read date (top) and remove button (bottom) -->
					<div class="flex flex-col items-end justify-between flex-shrink-0">
						{#if readDate}
							<span class="text-xs opacity-70 whitespace-nowrap mt-0.5">{readDate}</span>
						{/if}

						<button class="-mr-2 -mb-2 p-2 rounded-full hover:bg-theme-accent/5 opacity-70 hover:opacity-100 transition-opacity" aria-label="Remove {quranMetaData[chapter].transliteration} ({chapter}:{verse}) from reading history" title="Remove from history" on:click={() => removeEntry(item)}>
							<Trash size={4} aria-hidden="true" />
						</button>
					</div>
				</div>
			{:else}
				<p class="text-sm opacity-70">Your reading history is empty.</p>
			{/each}
		</div>
	</div>
</Modal>
