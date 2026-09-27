<script>
	export let key, value;

	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import PageDivider from '$display/verses/PageDivider.svelte';
	import { trackReadingPosition } from '$utils/trackReadingPosition';
	import { inview } from 'svelte-inview';
</script>

{#if value}
	<!-- show page/juz/hizb number  -->
	<PageDivider {key} />

	<div id={key} class="verse inline py-2 group verse-{value.meta.chapter}-{value.meta.verse}" data-words={value.meta.words} data-page={value.meta.page} data-juz={value.meta.juz} data-hizb={value.meta.hizb} use:inview on:inview_change={(event) => trackReadingPosition(value.meta, event.detail)}>
		<WordsBlock {key} {value} />
	</div>
{/if}
