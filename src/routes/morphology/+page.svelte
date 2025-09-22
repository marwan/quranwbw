<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import MorphologyView from './MorphologyView.svelte';
	import { __currentPage, __morphologyKey, __displayType } from '$utils/stores';

	// Restrict display types to 1 or 2
	if (![1, 2].includes($__displayType)) $__displayType = 1;

	__currentPage.set('morphology');
</script>

<PageHead title={`Morphology ${$__morphologyKey}`} />

<MorphologyView {data} />
