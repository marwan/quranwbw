<script>
	export let chapter = $__chapterNumber;
	export let chapters = null;
	export let lines = null;
	export let line = null;
	export let startVerse = null;
	export let page = null;

	import { __currentPage, __chapterNumber, __fontType, __websiteTheme } from '$utils/stores';
	import { isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';
	import { staticEndpoint, bismillahFonts } from '$data/websiteSettings';
	import { loadFont } from '$utils/loadFont';

	$: isUthmaniFontType = [1, 2, 3, 5, 7, 8].includes($__fontType);

	const bismillahTypes = {
		uthmaniType1: 'ﲚﲛﲞﲤ',
		uthmaniType2: 'ﲪﲫﲮﲴ',
		uthmaniType3: 'ﭗﲫﲮﲴ',
		indopakType: '﷽'
	};

	$: customFontPalette = '';

	function getBismillahFontName() {
		const elements = document.querySelectorAll('.bismillah');
		elements.forEach((el) => el.classList.add('invisible'));

		// Uthmanic Mushaf Tajweed
		const defaultBismillah = bismillahFonts[3].file;

		// Default font
		let { file: fileName, version: fontVersion } = {
			file: defaultBismillah,
			version: 13
		};

		// Pick from map if available
		if (bismillahFonts[$__fontType]) {
			({ file: fileName, version: fontVersion } = bismillahFonts[$__fontType]);
		}

		// Special override: Uthmanic Mushaf Tajweed
		if ($__fontType === 3) {
			fileName = isFirefoxDarkTajweed() ? bismillahFonts.firefoxDarkTajweed.file : defaultBismillah;
			customFontPalette = isFirefoxDarkTajweed() ? 'hafs-palette-firefox-dark' : 'theme-palette-tajweed';
			fontVersion = 13;
		}

		// Load font
		const url = `${staticEndpoint}/fonts/Extras/bismillah/${fileName}.woff2?version=${fontVersion}`;

		console.log(url);

		loadFont('bismillah', url).then(() => {
			elements.forEach((el) => el.classList.remove('invisible'));
		});
	}

	$: if ($__fontType) getBismillahFontName();

	$: commonClasses = `
		${$__fontType === 2 && $__websiteTheme === 5 ? 'mocha-night-font-color' : ''}
		${$__fontType === 2 && $__websiteTheme === 9 ? 'dark-luxury-font-color' : ''}
		${customFontPalette}
	`;

	$: chapterBismillahClasses = `
		${window.theme('text')}
		flex flex-col text-center flex-wrap block pb-2 
		${isUthmaniFontType && chapter === 2 ? 'pt-8' : 'pt-12'}
		${isUthmaniFontType ? `${chapter === 2 ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}` : 'arabic-font-4 text-3xl md:text-4xl'}
		${commonClasses}
	`;

	$: mushafBismillahClasses = `
		flex flex-col text-center leading-normal flex-wrap space-y-4 block
		${page === 1 || page === 2 ? 'md:mt-2' : 'md:mt-6'}
		${page === 2 ? 'text-[5vw] md:text-[36px] lg:text-[36px]' : 'text-[5vw] md:text-[32px] lg:text-[36px]'}
		${commonClasses}
	`;
</script>

<!-- chapter page -->
{#if ['chapter', 'juz'].includes($__currentPage)}
	{#if ![1, 9].includes(chapter) || (chapter === 1 && startVerse > 1)}
		<div style="font-family: bismillah" class={chapterBismillahClasses}>
			<!-- uthmani fonts -->
			{#if isUthmaniFontType}
				<span>
					{#if chapter === 2}
						{bismillahTypes.uthmaniType1}
					{:else if [95, 97].includes(chapter)}
						{bismillahTypes.uthmaniType3}
					{:else if ![1, 9, 2, 95, 97].includes(chapter) || (chapter === 1 && startVerse > 1)}
						{bismillahTypes.uthmaniType2}
					{/if}
				</span>

				<!-- indopak fonts -->
			{:else}
				{bismillahTypes.indopakType}
			{/if}
		</div>
	{/if}

	<!-- mushaf page -->
{:else if $__currentPage === 'mushaf'}
	<div style="font-family: bismillah" class={mushafBismillahClasses}>
		{#if chapters[lines.indexOf(line)] === 2}
			{bismillahTypes.uthmaniType1}
		{:else if [95, 97].includes(chapters[lines.indexOf(line)])}
			{bismillahTypes.uthmaniType3}
		{:else if ![1, 9, 2, 95, 97].includes(chapters[lines.indexOf(line)])}
			{bismillahTypes.uthmaniType2}
		{/if}
	</div>
{/if}
