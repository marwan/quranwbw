<script>
	export let key, value;

	import VerseOptionButtons from '$display/verses/VerseOptionButtons.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import Translations from '$display/verses/translations/Translations.svelte';
	import PageDivider from '$display/verses/PageDivider.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { inview } from 'svelte-inview';
</script>

{#if value}
	<!-- show page/juz number  -->
	<PageDivider {key} />

	<div id={key} class="verse flex flex-col py-8 space-y-8 verse-{value.meta.chapter}-{value.meta.verse}" data-words={value.meta.words} data-page={value.meta.page} data-juz={value.meta.juz} use:inview on:inview_enter={(event) => updateSettings({ type: 'lastRead', value: value.meta })}>
		<VerseOptionButtons {key} {value} />

		<!-- words -->
		<div class="flex flex-row-reverse flex-wrap">
			<WordsBlock {key} {value} />
		</div>

		<!-- verse translations and transliterations -->
		<Translations {value} />
	</div>

	<div class="border-b {window.theme('border')}"></div>
{/if}
