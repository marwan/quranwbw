<script>
	export let key, value;

	import VerseOptionButtons from '$display/verses/VerseOptionButtons.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
	import VerseTranslations from '$display/verses/VerseTranslations.svelte';
	import PageDivider from '$display/verses/PageDivider.svelte';
	import VerseSeparator from '$display/verses/VerseSeparator.svelte';
	import { updateSettings } from '$utils/updateSettings';
	import { __verseTranslations, __userColoredBookmarks, __websiteTheme } from '$utils/stores';
	import { inview } from 'svelte-inview';
	import { getVerseTintStyle } from '$utils/coloredBookmarks';

	// Use two columns when translations are available, otherwise fall back to one
	$: gridCols = $__verseTranslations.length > 0 ? 'grid-cols-2' : 'grid-cols-1';

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
		class="verse flex flex-col py-8 space-y-8 verse-{value.meta.chapter}-{value.meta.verse} rounded-xl transition-colors duration-200"
		style={tintStyle || undefined}
		data-words={value.meta.words}
		data-page={value.meta.page}
		data-juz={value.meta.juz}
		data-hizb={value.meta.hizb}
		use:inview
		on:inview_enter={() => updateSettings({ type: 'lastRead', value: value.meta })}
	>
		<VerseOptionButtons {key} {value} />

		<div class="grid {gridCols} gap-x-8">
			<!-- words -->
			<div class="order-last inline direction-rtl">
				<WordsBlock {key} {value} />
			</div>

			<!-- verse translations and transliterations -->
			<VerseTranslations {value} />
		</div>
	</div>

	<VerseSeparator {key} />
{/if}
