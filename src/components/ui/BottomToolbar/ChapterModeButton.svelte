<script>
	import List from '$svgs/List.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { pageNumberKeys } from '$data/quranMeta';
	import { __pageNumber } from '$utils/stores';
	import { term } from '$utils/terminologies';

	let verseKey, chapter, verse;

	$: {
		verseKey = pageNumberKeys[$__pageNumber - 1];
		chapter = +verseKey.split(':')[0];
		verse = +verseKey.split(':')[1];
	}
</script>

<a href="/{chapter}/{verse}" class="inline-flex flex-col items-center justify-center px-5 group hover:bg-theme-accent/5">
	<List />
	<span class="sr-only">{term('chapter')} Mode</span>
</a>
<Tooltip arrow={false} type="light" class="hidden md:block font-normal">{term('chapter')} Mode</Tooltip>
