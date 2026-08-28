<script>
	export let key, value;

	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import PageDivider from '$display/verses/PageDivider.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { inview } from 'svelte-inview';
	import { __userColoredBookmarks, __websiteTheme } from '$utils/stores';
	import { getVerseTintStyle } from '$utils/coloredBookmarks';

	$: colorId = (() => {
		try {
			const v = ($__userColoredBookmarks ?? {})[key];
			const n = Number(v);
			return n >= 1 && n <= 8 ? n : null;
		} catch {
			return null;
		}
	})();
	$: tintStyle = getVerseTintStyle(colorId, $__websiteTheme);
</script>

{#if value}
	<!-- show page/juz/hizb number  -->
	<PageDivider {key} />

	<div
		id={key}
		class="verse inline py-2 group verse-{value.meta.chapter}-{value.meta.verse} rounded-lg px-1.5 py-1 box-decoration-clone transition-colors duration-200"
		style={tintStyle || undefined}
		data-words={value.meta.words}
		data-page={value.meta.page}
		data-juz={value.meta.juz}
		data-hizb={value.meta.hizb}
		use:inview
		on:inview_enter={() => updateSettings({ type: 'lastRead', value: value.meta })}
	>
		<WordsBlock {key} {value} />
	</div>
{/if}
