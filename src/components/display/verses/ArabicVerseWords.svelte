<script>
	export let key;

	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { fetchChapterData } from '$utils/fetchData';
	import { __fontType, __userSettings } from '$utils/stores';

	const [chapter, verse] = key.split(':').map(Number);
	const fontSizes = JSON.parse($__userSettings).displaySettings.fontSizes;

	let fontType = $__fontType;

	// Mushaf font types (2, 3) aren't suitable here — fall back to Uthmanic Digital Font (1)
	$: if ([2, 3].includes($__fontType)) {
		fontType = 1;
	}

	// Fetch chapter data and extract the target verse's words
	$: chapterData = (async () => {
		const data = await fetchChapterData({ chapter, fontType, preventStoreUpdate: true, reRenderWhenTheseUpdates: [$__fontType] });
		return data[`${chapter}:${verse}`];
	})();
</script>

{#await chapterData}
	<Spinner size="8" inline={true} />
{:then data}
	<div class="direction-rtl leading-normal arabic-font-{fontType} {fontSizes.arabicText}">
		{data.words.arabic.join(' ')}
		<span class={$__fontType !== 10 && 'colored-fonts'}>{data.words.end}</span>
	</div>
{:catch error}
	<ErrorLoadingData {error} />
{/await}
