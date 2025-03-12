<script>
	export let key;

	import Spinner from '$svgs/Spinner.svelte';
	import { fetchVersesData } from '$utils/fetchData';
	import { __fontType } from '$utils/stores';
	import { splitDelimiter } from '$data/websiteSettings';

	$: fontType = [1, 2, 3, 5, 7, 8].includes($__fontType) ? 1 : 4;
	$: fetchData = fetchVersesData({ verses: key, fontType: fontType, skipSave: true });
</script>

{#await fetchData}
	<Spinner size="10" />
{:then data}
	<div class="direction-rtl text-3xl leading-normal arabic-font-{fontType}">
		{data[key].words.arabic.split(splitDelimiter).join(' ')}
		<span class="colored-fonts">{data[key].words.end}</span>
	</div>
{:catch error}
	<p>error.</p>
{/await}
