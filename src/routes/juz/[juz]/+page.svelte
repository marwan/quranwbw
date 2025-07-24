<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import Individual from '$display/verses/modes/Individual.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import ErrorLoadingDataFromAPI from '$misc/ErrorLoadingDataFromAPI.svelte';
	import { __currentPage, __displayType, __keysToFetch, __keysToFetchData, __pageURL, __fontType, __wordTranslation, __wordTransliteration } from '$utils/stores';
	import { staticEndpoint } from '$data/websiteSettings';
	import { term } from '$utils/terminologies';
	import { fetchAndCacheJson } from '$utils/fetchData';

	// only allow display type 1 & 2, and don't save the layout in settings
	if ([3, 4, 5].includes($__displayType)) $__displayType = 1;

	const juzNumber = data.juz;
	let juzKeysData;

	__pageURL.set(1);

	$: if ($__pageURL || $__fontType || $__wordTranslation || $__wordTransliteration) {
		__keysToFetchData.set({});

		juzKeysData = (async () => {
			try {
				const data = await fetchAndCacheJson(`${staticEndpoint}/meta/keysInJuz.json?version=1`, 'other');

				// storing the keys
				__keysToFetch.set(null);
				__keysToFetch.set(data[juzNumber]);

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
{:then _}
	<div id="individual-verses-block">
		<Individual />
	</div>
{:catch error}
	<ErrorLoadingDataFromAPI {error} />
{/await}
