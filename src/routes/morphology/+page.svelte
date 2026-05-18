<script>
	export let data;

	import PageHead from '$misc/PageHead.svelte';
	import MorphologyView from './MorphologyView.svelte';
	import { __currentPage, __morphologyKey, __displayType } from '$utils/stores';

	// Restrict display types to 1 or 2
	if (![1, 2].includes($__displayType)) $__displayType = 1;

	__currentPage.set('morphology');
	let description = `Morphology of the word "${$__morphologyKey}" in the Quran, including its root, pattern, and grammatical features.`;
</script>

<PageHead title={`Morphology ${$__morphologyKey}`} {description} />

<MorphologyView {data} />
