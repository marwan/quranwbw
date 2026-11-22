<script>
	import { askableIndexes } from '../utils/guessTheWordSet';
	import { term } from '$utils/terminologies';

	export let ayah;
	export let chapterTransliteration;
	export let wordIndex;
	export let outcomes = [];

	// Counted over the words that are asked: words without a meaning in the chosen language are skipped.
	$: askable = askableIndexes(ayah);
	$: wordNumber = Math.max(1, askable.indexOf(wordIndex) + 1);
	$: completedWords = outcomes.filter(Boolean).length;
</script>

<section aria-label="Current {term('verse')}" class="px-1 sm:px-3">
	<!-- One row: chapter name and verse on the left, word counter and settings button on the right. -->
	<div class="flex flex-row items-center justify-between gap-x-3 text-sm">
		<h1 class="min-w-0 items-baseline whitespace-nowrap">
			{chapterTransliteration}, {ayah.key}
		</h1>
		<div class="flex flex-shrink-0 flex-row items-center gap-x-2">
			<p class="whitespace-nowrap tabular-nums" aria-live="polite" aria-atomic="true">Word {wordNumber} of {askable.length}</p>
			<slot name="settings" />
		</div>
	</div>

	<!-- Progress bar fills instantly -->
	<div class="mt-2 h-1 overflow-hidden rounded-full bg-theme-accent/15" role="progressbar" aria-label="Words practiced in this {term('verse')}" aria-valuemin="0" aria-valuemax={askable.length} aria-valuenow={completedWords}>
		<div class="h-full origin-left rounded-full bg-theme-accent" style:transform="scaleX({completedWords / askable.length})"></div>
	</div>
</section>
