<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __currentPage, __displayType, __pageURL, __fontType, __wordTranslation, __wordTransliteration } from '$utils/stores';
	import { cdnStaticDataUrls } from '$data/websiteSettings';
	import { term } from '$utils/terminologies';
	import { fetchAndCacheJson } from '$utils/fetchData';

	// only allow display type 1 & 2, and don't save the layout in settings
	if ([3, 4, 5].includes($__displayType)) $__displayType = 1;

	const hizbNumber = Number(data.hizb);
	const isValidHizb = Number.isInteger(hizbNumber) && hizbNumber >= 1 && hizbNumber <= 60;
	let hizbKeysData;

	$: if ($__pageURL || $__fontType || $__wordTranslation || $__wordTransliteration) {
		hizbKeysData = (async () => {
			try {
				if (!isValidHizb) return '';
				const data = await fetchAndCacheJson(cdnStaticDataUrls.keysInHizb, 'other');
				return data[hizbNumber] ?? '';
			} catch (error) {
				console.warn(error);
				return '';
			}
		})();
	}

	__pageURL.set(1);
	__currentPage.set('hizb');
</script>

<PageHead title={`${term('hizb')} ${hizbNumber}`} />

{#await hizbKeysData}
	<Spinner />
{:then hizbKeys}
	{#if isValidHizb && hizbKeys.length > 0}
		<div id="individual-verses-block">
			<FullVersesDisplay keys={hizbKeys} />
		</div>
	{:else}
		<ErrorLoadingData error={new Error('Invalid hizb number')} />
	{/if}
{:catch error}
	<ErrorLoadingData {error} />
{/await}
