<script>
	export let chapter = $__chapterNumber;
	export let chapters = null;
	export let lines = null;
	export let line = null;
	export let startVerse = null;
	export let page = null;

	import { __currentPage, __chapterNumber, __fontType, __websiteTheme } from '$utils/stores';
	import { selectableFontTypes } from '$data/options';
	import { isFirefoxDarkTajweed } from '$utils/getMushafWordFontLink';
	import { staticEndpoint } from '$data/websiteSettings';
	import { loadFont } from '$utils/loadFont';

	$: isUthmaniFontType = selectableFontTypes[$__fontType].type === 'Uthmanic';

	// Unified Bismillah Font Map
	const bismillahFontMap = {
		1: {
			file: 'qcf-bismillah-normal',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ',
				chapters: {
					2: 'ﲚﲛﲞﲤ',
					95: 'ﭗﲫﲮﲴ',
					97: 'ﭗﲫﲮﲴ'
				}
			}
		},
		2: {
			file: 'qcf-bismillah-normal',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ',
				chapters: {
					2: 'ﲚﲛﲞﲤ',
					95: 'ﭗﲫﲮﲴ',
					97: 'ﭗﲫﲮﲴ'
				}
			}
		},
		3: {
			file: 'QCF_Bismillah_COLOR-Regular',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ',
				chapters: {
					2: 'ﲚﲛﲞﲤ',
					95: 'ﭗﲫﲮﲴ',
					97: 'ﭗﲫﲮﲴ'
				}
			}
		},
		4: {
			file: 'IndopakBismillah-Arabic',
			version: 13,
			bismillah: {
				default: '﷽'
			}
		},
		5: {
			file: 'Qcf-nastaleeq-bismillah-normal',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ',
				chapters: {
					2: 'ﲚﲛﲞﲤ'
				}
			}
		},
		6: {
			file: 'IndopakBismillah-Arabic',
			version: 13,
			bismillah: {
				default: '﷽'
			}
		},
		7: {
			file: 'qcf-bismillah-bold',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ',
				chapters: {
					2: 'ﲚﲛﲞﲤ'
				}
			}
		},
		8: {
			file: 'Qcf-nastaleeq-bismillah-bold',
			version: 13,
			bismillah: {
				default: 'ﲪﲫﲮﲴ'
			}
		},
		9: {
			file: 'MisbahBismillah-Arabic',
			version: 13,
			bismillah: {
				default: '﷽'
			}
		},
		10: {
			file: 'QCF_BSML-Regular',
			version: 1,
			bismillah: {
				default: 'ﭑﭒﭓﭐ',
				chapters: {
					2: 'ﭚﭛﭜﭝ',
					95: 'ﭔﭕﭖ',
					97: 'ﭔﭕﭖ'
				}
			}
		},
		11: {
			file: 'MSI_BASMALAH-Regular',
			version: 1,
			bismillah: {
				default: '4321',
				chapters: {
					2: '$#"!'
				}
			}
		}
	};

	$: customFontPalette = '';

	function getBismillahFontName() {
		const elements = document.querySelectorAll('.bismillah');
		elements.forEach((el) => el.classList.add('invisible'));

		let { file: fileName, version: fontVersion } = {
			file: 'QCF_Bismillah_COLOR-Regular',
			version: 13
		};

		if (bismillahFontMap[$__fontType]) {
			({ file: fileName, version: fontVersion } = bismillahFontMap[$__fontType]);
		}

		if ($__fontType === 3) {
			fileName = isFirefoxDarkTajweed() ? 'QCF_Bismillah_COLOR-Dark-FF-Regular' : 'QCF_Bismillah_COLOR-Regular';
			customFontPalette = isFirefoxDarkTajweed() ? 'hafs-palette-firefox-dark' : 'theme-palette-tajweed';
			fontVersion = 13;
		}

		const url = `${staticEndpoint}/fonts/Extras/bismillah/${fileName}.woff2?version=${fontVersion}`;

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

	function getBismillahCode(chapter) {
		const fontData = bismillahFontMap[$__fontType];
		if (!fontData) return '';
		const { bismillah } = fontData;
		if (bismillah.chapters && bismillah.chapters[chapter]) return bismillah.chapters[chapter];
		return bismillah.default;
	}
</script>

<!-- chapter page -->
{#if ['chapter', 'juz'].includes($__currentPage)}
	{#if ![1, 9].includes(chapter) || (chapter === 1 && startVerse > 1)}
		<div style="font-family: bismillah" class={chapterBismillahClasses}>
			<span>{getBismillahCode(chapter)}</span>
		</div>
	{/if}

	<!-- mushaf page -->
{:else if $__currentPage === 'mushaf'}
	{#if chapters && lines}
		{#if ![1, 9].includes(chapters[lines.indexOf(line)])}
			<div style="font-family: bismillah" class={mushafBismillahClasses}>
				{getBismillahCode(chapters[lines.indexOf(line)])}
			</div>
		{/if}
	{/if}
{/if}
