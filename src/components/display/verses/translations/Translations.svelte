<script>
	export let value;

	import Layout from '$display/verses/translations/Layout.svelte';
	import Skeleton from '$ui/FlowbiteSvelte/skeleton/Skeleton.svelte';
	import { __currentPage, __verseKey, __verseTranslations, __verseTranslationData, __chapterData, __userSettings, __wordTranslation, __wordTransliteration, __keysToFetch, __keysToFetchData } from '$utils/stores';
	import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';

	let verseTranslationData, verseTransliterationData;

	$: fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	$: verseTranslationClasses = `verseTranslationText flex flex-col space-y-4 leading-normal ${fontSizes.verseTranslationText}`;

	// Setting the variables depending on the page
	$: chapterData = $__currentPage === 'mushaf' ? JSON.parse(localStorage.getItem('pageData')) : $__chapterData;
	$: chapterToFetch = $__currentPage === 'mushaf' ? parseInt($__verseKey.split(':')[0], 10) : value.meta.chapter;

	// Fetch verse translations for pages other than chapter (reactive)
	$: if ($__currentPage !== 'chapter') verseTranslationData = fetchVerseTranslationData({});

	// // Fetch verse transliteration for pages other than chapter (non-reactive)
	// if ($__currentPage !== 'chapter') {
	// 	verseTransliterationData = fetchChapterData({ chapter: value.meta.chapter, reRenderWhenTheseUpdates: $__verseTranslations });
	// }

	// This function takes two arguments: translationsObject and translationsSelected.
	// It first filters out IDs 1 or 3 (transliterations) from translationsSelected.
	// Then, it maps the remaining IDs to their corresponding translation objects from translationsObject, returning a sorted array of these translation objects in the specified order.
	// This ensures that the translations are displayed in the desired sequence
	function getSortedTranslations(translationsObject, translationsSelected) {
		const filteredSelections = translationsSelected.filter((id) => id !== 1 && id !== 3);
		return filteredSelections.map((id) => translationsObject.find((translation) => translation.resource_id === id));
	}
</script>

{#if $__verseTranslations.length > 0}
	<div class={verseTranslationClasses} data-fontSize={fontSizes.verseTranslationText}>
		<!-- for chapter page, we fetch the translation for the whole chapter in one go -->
		{#if $__verseTranslationData}
			{#each $__verseTranslations as id}
				{@const verseKey = `${value.meta.chapter}:${value.meta.verse}`}
				<Layout verseTranslationID={id} verseTranslation={$__verseTranslationData[id][verseKey]} {value} />
			{/each}
		{:else}
			<Skeleton size="xxl" class="mb-2.5" />
		{/if}
	</div>
{/if}
