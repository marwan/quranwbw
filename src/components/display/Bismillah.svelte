<script>
	export let chapter = $__chapterNumber;
	export let chapters = null;
	export let lines = null;
	export let line = null;
	export let startVerse = null;

	import { __currentPage, __chapterNumber, __fontType, __websiteTheme } from '$utils/stores';

	const bismillahTypes = {
		uthmaniType1: 'ﲚﲛﲞﲤ',
		uthmaniType2: 'ﲪﲫﲮﲴ',
		indopakType: '﷽'
	};

	const commonClasses = `
		${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
		${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
	`;

	const chapterBismillahClasses = `
		${window.theme('text')}
		flex flex-col text-center flex-wrap block pt-6 pb-4 
		${[1, 2, 3, 5].includes($__fontType) ? `bismillah ${chapter === 2 ? 'text-3xl' : 'text-2xl md:text-3xl'}` : 'arabic-font-4 text-3xl md:text-4xl'}
		${commonClasses}
		`;

	// If tajweed fonts were select, apply tajweed palette
	// But in Mocha Night & Dark Luxury themes, if non-tajweed fonts were selected, use custom palette to match theme
	const mushafBismillahClasses = `
		bismillah flex flex-col text-center leading-normal flex-wrap space-y-4 block md:mt-6 text-[5vw] md:text-[32px] lg:text-[36px] 
		${$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'}
		${commonClasses}
	`;
</script>

<!-- chapter page -->
{#if ['chapter', 'juz'].includes($__currentPage)}
	{#if ![1, 9].includes(chapter) || (chapter === 1 && startVerse > 1)}
		<div class={chapterBismillahClasses}>
			<!-- uthmani fonts -->
			{#if [1, 2, 3, 5].includes($__fontType)}
				<span class={$__fontType === 1 ? 'theme-palette-normal' : $__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'}>
					{#if chapter === 2}
						{bismillahTypes.uthmaniType1}
					{:else if ![1, 9, 2].includes(chapter) || (chapter === 1 && startVerse > 1)}
						{bismillahTypes.uthmaniType2}
					{/if}
				</span>

				<!-- indopak fonts -->
			{:else if [4, 6].includes($__fontType)}
				{bismillahTypes.indopakType}
			{/if}
		</div>
	{/if}

	<!-- mushaf page -->
{:else if $__currentPage === 'mushaf'}
	<div class={mushafBismillahClasses}>
		{#if chapters[lines.indexOf(line)] === 2}
			{bismillahTypes.uthmaniType1}
		{:else if ![1, 9, 2].includes(chapters[lines.indexOf(line)])}
			{bismillahTypes.uthmaniType2}
		{/if}
	</div>
{/if}
