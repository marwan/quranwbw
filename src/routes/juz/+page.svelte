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

	let juzKeysData;

	// Reactive number from the URL (?id=...), updates on navigation
	$: juzNumber = Number($page.url.searchParams.get('id')) || 1;

	$: if (juzNumber && ($__pageURL || $__fontType || $__wordTranslation || $__wordTransliteration)) {
		juzKeysData = (async () => {
			try {
				const data = await getSegmentKeys('juz');
				return data[juzNumber] ?? '';
			} catch (error) {
				console.warn(error);
				return '';
			}
		})();
	}

	__pageURL.set(1);
	__currentPage.set('juz');
</script>

{#key juzNumber}
	<PageHead title={`${term('juz')} ${juzNumber}`} />
{/key}

{#await juzKeysData}
	<Spinner />
{:then juzKeys}
	{#if juzKeys.length > 0}
		<div id="individual-verses-block">
			<FullVersesDisplay keys={juzKeys} />
		</div>
	{:else}
		<ErrorLoadingData />
	{/if}
{:catch error}
	<ErrorLoadingData {error} />
{/await}
