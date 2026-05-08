// Each entry maps a font type to:
//  file - the .woff2 filename (without extension) served from the CDN
//  version - cache-busting version number
//  bismillah:
//   default - the Unicode characters to render for most chapters
//   chapters (opt.) - per-chapter overrides (e.g. chapter 2 has a unique glyph set)
export const bismillahFontMap = {
	// 1: Uthmanic Digital Font
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

	// 2: Uthmanic Mushaf (non-Tajweed)
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

	// 3: Uthmanic Mushaf Tajweed (COLOR font; Firefox dark mode uses a separate file — see getBismillahFontName)
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

	// 4: Qalam Digital Font (Madinah Edition)
	4: {
		file: 'IndopakBismillah-Arabic',
		version: 13,
		bismillah: {
			default: '﷽'
		}
	},

	// 5: Uthman Taha Digital (Nastaleeq)
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

	// 6: Qalam Digital Font (Hanafi Edition) — same font file as type 4
	6: {
		file: 'IndopakBismillah-Arabic',
		version: 13,
		bismillah: {
			default: '﷽'
		}
	},

	// 7: Uthmanic Digital Bold
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

	// 8: Uthman Taha Digital Bold (Nastaleeq)
	8: {
		file: 'Qcf-nastaleeq-bismillah-bold',
		version: 13,
		bismillah: {
			default: 'ﲪﲫﲮﲴ'
		}
	},

	// 9: Indonesian Isep Misbah Digital Font
	9: {
		file: 'MisbahBismillah-Arabic',
		version: 13,
		bismillah: {
			default: '﷽'
		}
	},

	// 10: Majidi Nastaleeq Digital Font
	10: {
		file: 'Majidi5_Bismillah-Bold',
		version: 1,
		bismillah: {
			default: '﷽'
		}
	},

	// Special override — not a selectable font type.
	// Used automatically when font type 3 (Tajweed COLOR) is active in Firefox dark mode.
	firefoxDarkTajweed: {
		file: 'QCF_Bismillah_COLOR-Dark-FF-Regular',
		version: 13
	}
};
