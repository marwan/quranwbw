<script>
	import PageHead from '$misc/PageHead.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingData from '$misc/ErrorLoadingData.svelte';
	import { __currentPage, __displayType, __pageURL, __fontType, __wordTranslation, __wordTransliteration } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getSegmentKeys } from '$utils/getSegmentKeys';
	import { page } from '$app/stores';

	// only allow display type 1 & 2, and don't save the layout in settings
	if ([3, 4, 5].includes($__displayType)) $__displayType = 1;

	let hizbKeysData;

	// Reactive number from the URL (?id=...), updates on navigation
	$: hizbNumber = Number($page.url.searchParams.get('id')) || 1;

	$: if (hizbNumber && ($__pageURL || $__fontType || $__wordTranslation || $__wordTransliteration)) {
		hizbKeysData = (async () => {
			try {
				const data = await getSegmentKeys('hizb');
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

{#key hizbNumber}
	<PageHead title={`${term('hizb')} ${hizbNumber}`} />
{/key}

{#await hizbKeysData}
	<Spinner />
{:then hizbKeys}
	{#if hizbKeys.length > 0}
		<div id="individual-verses-block">
			<FullVersesDisplay keys={hizbKeys} />
		</div>
	{:else}
		<ErrorLoadingData />
	{/if}
{:catch error}
	<ErrorLoadingData {error} />
{/await}
