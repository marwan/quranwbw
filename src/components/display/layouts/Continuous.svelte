<script>
	export let key, value;

	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import PageDivider from '$display/verses/PageDivider.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { inview } from 'svelte-inview';
</script>

{#if value}
	<!-- show page/juz number  -->
	<PageDivider {key} />

	<div id={key} class="verse inline py-2 group verse-{value.meta.chapter}-{value.meta.verse}" data-words={value.meta.words} data-page={value.meta.page} data-juz={value.meta.juz} use:inview on:inview_enter={(event) => updateSettings({ type: 'lastRead', value: value.meta })}>
		<WordsBlock {key} {value} />
	</div>
{/if}
