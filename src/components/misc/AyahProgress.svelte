<script>
	export let ayah;
	export let chapterName;
	export let chapterTransliteration;
	export let wordIndex;
	export let outcomes = [];
	$: completedWords = outcomes.filter(Boolean).length;
</script>

<section class="border-b border-theme-accent/20 pb-4" aria-label="Current ayah">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-lg font-semibold md:text-xl">{chapterName}</h1>
			<p class="mt-1 text-sm text-theme-text/75">{chapterTransliteration} <span class="inline-block">· Ayah {ayah.key}</span></p>
		</div>
		<div class="shrink-0 text-right" aria-live="polite" aria-atomic="true">
			<p class="text-sm tabular-nums">Word <strong>{wordIndex + 1}</strong> of {ayah.words.length}</p>
			{#if wordIndex > 0 || ayah.words.length === 1}
				<p class="mt-1 text-xs text-theme-text/75">
					{wordIndex === ayah.words.length - 1 ? 'Last word of this ayah' : 'One word at a time'}
				</p>
			{/if}
		</div>
	</div>
	<div class="mt-4 h-1 overflow-hidden rounded-full bg-theme-accent/15" role="progressbar" aria-label="Words practiced in this ayah" aria-valuemin="0" aria-valuemax={ayah.words.length} aria-valuenow={completedWords}>
		<div class="h-full rounded-full bg-theme-accent transition-[width] duration-200 motion-reduce:transition-none" style:width={(completedWords / ayah.words.length) * 100 + '%'}></div>
	</div>
	<details class="mt-3">
		<summary class="w-fit cursor-pointer rounded text-xs text-theme-text/75 hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent">View ayah in Arabic</summary>
		<p class="arabic-font-1 mt-3 text-right text-2xl leading-loose md:text-3xl" dir="rtl" lang="ar">
			{#each ayah.words as word, index}
				<span class="inline-block rounded px-1 {index === wordIndex ? 'bg-theme-accent/15 underline decoration-theme-accent underline-offset-8' : ''}" aria-current={index === wordIndex ? 'step' : undefined}>{word.word_arabic}</span>{' '}
			{/each}
		</p>
	</details>
</section>
