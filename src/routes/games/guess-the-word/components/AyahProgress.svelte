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

	// The title is already in place when the page opens; it only slides in for the ayahs that follow.
	const firstAyahKey = ayah.key;
	let slideTitle = false;
	$: if (ayah.key !== firstAyahKey) slideTitle = true;
</script>

<section aria-label="Current {term('verse')}" class="px-1 sm:px-3">
	<!-- One row: chapter name and verse on the left, word counter and settings button on the right. -->
	<div class="flex flex-row items-center justify-between gap-x-3">
		{#key ayah.key}
			<h1 class:title-in={slideTitle} class="flex min-w-0 items-baseline whitespace-nowrap text-sm">
				<!-- The chapter name gets "…" when space runs out, the verse number always stays visible. -->
				<span class="min-w-0 truncate">{chapterTransliteration}, {ayah.key}</span>
			</h1>
		{/key}
		<div class="flex flex-shrink-0 flex-row items-center gap-x-2">
			<p class="whitespace-nowrap text-sm tabular-nums" aria-live="polite" aria-atomic="true">Word {wordNumber} of {askable.length}</p>
			<slot name="settings" />
		</div>
	</div>

	<!-- Progress bar fills instantly -->
	<div class="mt-3 h-1 overflow-hidden rounded-full bg-theme-accent/15" role="progressbar" aria-label="Words practiced in this {term('verse')}" aria-valuemin="0" aria-valuemax={askable.length} aria-valuenow={completedWords}>
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
