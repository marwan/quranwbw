<script>
	import { askableIndexes } from '../utils/guessTheWordSet';

	export let ayah;
	export let chapterName;
	export let chapterTransliteration;
	export let wordIndex;
	export let outcomes = [];

	// Counted over the words that are asked: words without a meaning in the chosen language are skipped.
	$: askable = askableIndexes(ayah);
	$: wordNumber = Math.max(1, askable.indexOf(wordIndex) + 1);
	$: completedWords = outcomes.filter(Boolean).length;
</script>

<!-- The header stays mounted across ayahs. The title is keyed on the ayah and slides in like the ayah line
(CSS on the compositor, so it never waits on script or layout). The progress bar fills instantly. -->
<section aria-label="Current ayah">
	<!-- Two rows: title | settings cog, then surah and ayah | word counter (sharing a baseline). -->
	<div class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1">
		{#key ayah.key}
			<h1 class="title-in min-w-0 text-lg font-semibold md:text-xl">{chapterName}</h1>
		{/key}
		<div class="flex self-center justify-self-end">
			<slot name="settings" />
		</div>
		{#key ayah.key}
			<p class="title-in min-w-0 text-sm text-theme-text/75">{chapterTransliteration} <span class="inline-block">· Ayah {ayah.key}</span></p>
		{/key}
		<p class="justify-self-end whitespace-nowrap text-sm tabular-nums" aria-live="polite" aria-atomic="true">Word <strong>{wordNumber}</strong> of {askable.length}</p>
	</div>
	<div class="mt-4 h-1 overflow-hidden rounded-full bg-theme-accent/15" role="progressbar" aria-label="Words practiced in this ayah" aria-valuemin="0" aria-valuemax={askable.length} aria-valuenow={completedWords}>
		<div class="h-full origin-left rounded-full bg-theme-accent" style:transform="scaleX({completedWords / askable.length})"></div>
	</div>
</section>

<style>
	.title-in {
		animation: title-in 250ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	@keyframes title-in {
		from {
			opacity: 0;
			transform: translateX(-16px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.title-in {
			animation: none;
		}
	}
</style>
