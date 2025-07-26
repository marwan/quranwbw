<!-- for supplications and duas routes -->
<script>
	import PageHead from '$misc/PageHead.svelte';
	import Individual from '$display/verses/modes/Individual.svelte';
	import { __currentPage } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { supplicationsFromQuran } from '$data/quranMeta';

	// Set the current page to 'supplications'
	__currentPage.set('supplications');
</script>

<PageHead title={`Quranic ${term('supplications')}`} />

<div id="individual-verses-block">
	<Individual keys={Object.keys(supplicationsFromQuran).toString()} />
</div>
