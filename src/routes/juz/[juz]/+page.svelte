<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import Individual from '$display/verses/modes/Individual.svelte';
	import { __currentPage, __displayType, __userBookmarks, __keysToFetch } from '$utils/stores';
	import { staticEndpoint } from '$data/websiteSettings';

	// only allow display type 1 & 2, and don't save the layout in settings
	if ([3, 4, 5].includes($__displayType)) $__displayType = 1;

	const juzNumber = data.juz;

	// Fetch words data for morphology
	$: fetchJuzKeys = (async () => {
		try {
			const response = await fetch(`${staticEndpoint}/meta/keysInJuz.json`);
			const data = await response.json();

			// storing the keys
			__keysToFetch.set(null);
			__keysToFetch.set(data[juzNumber]);

			return data[juzNumber];
		} catch (error) {
			console.error(errorLoadingDataMessage, error);
			return [];
		}
	})();

	__currentPage.set('juz');
</script>

<PageHead title={`Juz ${juzNumber}`} />

{#await fetchJuzKeys}
	<!-- <Spinner /> -->
{:then fetchJuzKeys}
	<div id="individual-verses-block">
		<Individual />
	</div>
{:catch error}
	<p>...</p>
{/await}
