<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import Individual from '$display/verses/modes/Individual.svelte';
	import { __currentPage, __displayType, __keysToFetch } from '$utils/stores';

	// Restrict display types to 1 or 2
	if (![1, 2].includes($__displayType)) $__displayType = 1;

	// storing the keys
	__keysToFetch.set(null);
	__keysToFetch.set(data.keys);

	__currentPage.set('verses');
</script>

<PageHead title={'Verses'} />

<div id="individual-verses-block">
	<Individual />
</div>
