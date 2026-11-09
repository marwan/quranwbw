<script>
	export let ayah;
	export let chapterName;
	export let chapterTransliteration;
	export let wordIndex;
	export let outcomes = [];

	$: completedWords = outcomes.filter(Boolean).length;
</script>

<!-- The header stays mounted across ayahs. The title is keyed on the ayah and slides in like the ayah line
(CSS on the compositor, so it never waits on script or layout). The progress bar fills instantly. -->
<section class="border-b border-theme-accent/20 pb-4" aria-label="Current ayah">
	<div class="flex items-start justify-between gap-4">
		{#key ayah.key}
			<div class="title-in min-w-0">
				<h1 class="text-lg font-semibold md:text-xl">{chapterName}</h1>
				<p class="mt-1 text-sm text-theme-text/75">{chapterTransliteration} <span class="inline-block">· Ayah {ayah.key}</span></p>
			</div>
		{/key}
		<div class="shrink-0 text-right" aria-live="polite" aria-atomic="true">
			<p class="text-sm tabular-nums">Word <strong>{wordIndex + 1}</strong> of {ayah.words.length}</p>
			<!-- Always takes its line so the header height never changes between words or ayahs. -->
			<p class="mt-1 text-xs text-theme-text/75" class:invisible={wordIndex === 0 && ayah.words.length > 1}>
				{wordIndex === ayah.words.length - 1 ? 'Last word of this ayah' : 'One word at a time'}
			</p>
		</div>
	</div>
	<div class="mt-4 h-1 overflow-hidden rounded-full bg-theme-accent/15" role="progressbar" aria-label="Words practiced in this ayah" aria-valuemin="0" aria-valuemax={ayah.words.length} aria-valuenow={completedWords}>
		<div class="h-full origin-left rounded-full bg-theme-accent" style:transform="scaleX({completedWords / ayah.words.length})"></div>
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
