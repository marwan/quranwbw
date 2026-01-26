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

	const juzNumber = data.juz;
	let juzKeysData;

	__pageURL.set(1);

	$: if ($__pageURL || $__fontType || $__wordTranslation || $__wordTransliteration) {
		juzKeysData = (async () => {
			try {
				const data = await fetchAndCacheJson(cdnStaticDataUrls.keysInJuz, 'other');
				return data[juzNumber];
			} catch (error) {
				console.warn(error);
				return [];
			}
		})();
	}

	__currentPage.set('juz');
</script>

<PageHead title={`${term('juz')} ${juzNumber}`} />

{#await juzKeysData}
	<Spinner />
{:then juzKeys}
	<div id="individual-verses-block">
		<FullVersesDisplay keys={juzKeys.toString()} />
	</div>
{:catch error}
	<ErrorLoadingData {error} />
{/await}
