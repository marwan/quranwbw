<script>
	export let pageNumber;
	export let chapters = [];
	export let verses = [];
	export let lines = [];
	export let startingLine;
	export let endingLine;
	export let dataKey; // e.g., "rightPageData", "pageData-xxx"
	export let fontType;
	export let centeredPageLines = [];

	import Bismillah from '$misc/Bismillah.svelte';
	import ChapterHeader from '$misc/ChapterHeader.svelte';
	import WordsBlock from '$display/verses/WordsBlock.svelte';
</script>

<div class="max-w-3xl md:max-w-[40rem] pb-2 mx-auto text-[5.4vw] md:text-[36px] lg:text-[36px] {+pageNumber === 1 ? 'space-y-1' : 'space-y-2'}">
	{#each Array.from({ length: endingLine - startingLine + 1 }, (_, i) => i + startingLine) as line}
		{#if chapters.length > 0 && lines.includes(line) && verses[lines.indexOf(line)] === 1}
			<div class="flex flex-col my-2">
				<ChapterHeader chapter={chapters[lines.indexOf(line)]} />
				<Bismillah {chapters} {lines} {line} />
			</div>
		{/if}

		<div
			class="line {line} flex px-2 arabic-font-{fontType}
        {+pageNumber < 3 || centeredPageLines.includes(`${+pageNumber}:${line}`) ? 'justify-center' : null}
        {+pageNumber > 2 && !centeredPageLines.includes(`${+pageNumber}:${line}`) ? 'justify-between' : null}"
		>
			{#each Object.entries(JSON.parse(localStorage.getItem(dataKey))) as [key, value]}
				<WordsBlock {key} {value} {line} />
			{/each}
		</div>
	{/each}
</div>
