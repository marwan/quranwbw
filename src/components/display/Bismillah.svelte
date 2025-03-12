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
		uthmaniType3: 'ﭗﲫﲮﲴ',
		indopakType: '﷽'
	};

	// Utility function to determine Bismillah type
	const getBismillahType = (chapter) => {
		if (chapter === 2) return bismillahTypes.uthmaniType1;
		if ([95, 97].includes(chapter)) return bismillahTypes.uthmaniType3;
		if (![1, 9, 2, 95, 97].includes(chapter)) return bismillahTypes.uthmaniType2;
		return null;
	};

	const commonClasses = `
		${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
		${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
	`;

	const chapterBismillahClasses = `
		${window.theme('text')}
		flex flex-col text-center flex-wrap pt-6 pb-4 
		${[1, 2, 3, 5, 7].includes($__fontType) ? `bismillah ${chapter === 2 ? 'text-3xl' : 'text-2xl md:text-3xl'}` : 'arabic-font-4 text-3xl md:text-4xl'}
		${commonClasses}
	`;

	const mushafBismillahClasses = `
		bismillah flex flex-col text-center leading-normal flex-wrap space-y-4 md:mt-6 text-[5vw] md:text-[32px] lg:text-[36px] 
		${$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'}
		${commonClasses}
	`;

	// Get current chapter for mushaf page
	const currentChapter = chapters?.[lines?.indexOf(line)];
</script>

{#if ['chapter', 'juz'].includes($__currentPage)}
	{#if ![1, 9].includes(chapter) || (chapter === 1 && startVerse > 1)}
		<div class={chapterBismillahClasses}>
			{#if [1, 2, 3, 5, 7].includes($__fontType)}
				<span class={$__fontType === 3 ? 'theme-palette-tajweed' : 'theme-palette-normal'}>
					{getBismillahType(chapter)}
				</span>
			{:else if [4, 6].includes($__fontType)}
				{bismillahTypes.indopakType}
			{/if}
		</div>
	{/if}
{:else if $__currentPage === 'mushaf'}
	{#if currentChapter}
		<div class={mushafBismillahClasses}>
			{getBismillahType(currentChapter)}
		</div>
	{/if}
{/if}
