<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import FullVersesDisplay from '$display/verses/modes/FullVersesDisplay.svelte';
	import { __currentPage, __displayType } from '$utils/stores';

	// Restrict display types to 1 or 2
	if (![1, 2].includes($__displayType)) $__displayType = 1;

	__currentPage.set('verses');
</script>

<PageHead title={'Verses'} />

<div id="individual-verses-block">
	<FullVersesDisplay keys={data.keys.toString()} />
</div>
