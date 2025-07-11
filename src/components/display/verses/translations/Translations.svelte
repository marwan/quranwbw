<script>
	export let value;

	import Layout from '$display/verses/translations/Layout.svelte';
	import Skeleton from '$ui/FlowbiteSvelte/skeleton/Skeleton.svelte';
	import { __currentPage, __verseTranslations, __verseTranslationData, __userSettings } from '$utils/stores';
	import { fetchVerseTranslationData } from '$utils/fetchData';

	$: fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;
	$: verseTranslationClasses = `verseTranslationText flex flex-col space-y-4 leading-normal ${fontSizes.verseTranslationText}`;

	// Fetch verse translations for pages other than chapter (reactive)
	$: if ($__currentPage !== 'chapter') fetchVerseTranslationData({ reRenderWhenTheseUpdates: $__verseTranslations });
</script>

{#if $__verseTranslations.length > 0}
	<div class={verseTranslationClasses} data-fontSize={fontSizes.verseTranslationText}>
		{#if $__verseTranslationData}
			{#each $__verseTranslations as id}
				{@const verseKey = `${value.meta.chapter}:${value.meta.verse}`}
				{#if $__verseTranslationData[id] && $__verseTranslationData[id][verseKey]}
					<Layout verseTranslationID={id} verseTranslation={$__verseTranslationData[id][verseKey]} {value} />
				{/if}
			{/each}
		{:else}
			<Skeleton size="xxl" class="mb-2.5" />
		{/if}
	</div>
{/if}
