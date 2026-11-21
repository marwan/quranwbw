<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { __currentPage, __readingHistoryModalVisible, __readingHistory } from '$utils/stores';
	import { quranMetaData } from '$data/quranMeta';
	import { individualCheckboxClasses } from '$data/commonClasses';
	import { getModalTransition } from '$utils/getModalTransition';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { fetchAndCacheJson } from '$utils/fetchData';
	import { resumeReadingSession, getReadingHistoryEntryUrl } from '$utils/readingHistoryHandler';
	import { shortTimeAgo } from '$utils/shortTimeAgo';
	import { term } from '$utils/terminologies';
	import { updateSettings } from '$utils/updateSettings';

	let fullQuranTextData = null;

	// Automatically close the modal whenever the user navigates to a new page
	$: if ($__currentPage) __readingHistoryModalVisible.set(false);

	$: if ($__readingHistoryModalVisible) loadQuranData();

	let now = Date.now();
	$: if ($__readingHistoryModalVisible) now = Date.now();

	function getViewLabel(item) {
		if (item.currentPage === 'mushaf' && item.page) return `Page ${item.page}`;
		if (item.currentPage === 'juz' && item.juz) return `${term('juz')} ${item.juz}`;
		if (item.currentPage === 'hizb' && item.hizb) return `${term('hizb')} ${item.hizb}`;
		return null;
	}

	function openEntry(item, entryUrl, index) {
		resumeReadingSession(item.id, entryUrl);
		window.rybbit?.event('Reading History Entry Click', { position: index + 1, view: item.currentPage ?? 'chapter' });
	}

	function removeEntry(item) {
		updateSettings({ type: 'removeReadingHistoryEntry', value: item.id });
		window.rybbit?.event('Remove Reading History Entry');
	}

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
				{@const readTime = shortTimeAgo(item.updatedAt, now)}

				<div class="{individualCheckboxClasses} flex items-stretch gap-3 w-full min-w-0 overflow-hidden">
					<a href={entryUrl} class="flex-1 min-w-0 overflow-hidden" on:click={() => openEntry(item, entryUrl, index)}>
						<div class="line-clamp-1">
							<!-- Small screens show only chapter:verse, larger screens the full surah name too -->
							{index + 1}. <span class="md:hidden">{chapter}:{verse}</span><span class="hidden md:inline">{quranMetaData[chapter].transliteration} ({chapter}:{verse})</span>{#if viewLabel}<span class="opacity-70 ml-1">· {viewLabel}</span>{/if}
						</div>

						{#if fullQuranTextData}
							<div class="text-md truncate text-right direction-rtl arabic-font-1 opacity-70 mt-2" lang="ar">
								{fullQuranTextData.data[`${chapter}:${verse}`]}
							</div>
						{/if}
					</a>

					<div class="flex flex-col items-end justify-between flex-shrink-0">
						{#if readTime}
							<span class="text-xs opacity-70 whitespace-nowrap mt-0.5">{readTime}</span>
						{/if}

						<button class="mt-auto -mr-2 -mb-2 p-2 rounded-full hover:bg-theme-accent/5 opacity-70 hover:opacity-100 transition-opacity" aria-label="Remove {quranMetaData[chapter].transliteration} ({chapter}:{verse}) from reading history" title="Remove from history" on:click={() => removeEntry(item)}>
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
