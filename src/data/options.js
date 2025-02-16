export const selectableDisplays = {
	1: { displayID: 1, displayName: 'Word by Word', displayComponent: 'WBWDisplay', layout: 'wbw', continuous: false, customClasses: null, disallowedIn: [] },
	2: { displayID: 2, displayName: 'Normal', displayComponent: 'NormalDisplay', layout: 'normal', continuous: false, customClasses: null, disallowedIn: [] },
	3: { displayID: 3, displayName: 'Continuous Word by Word', displayComponent: 'ContinuousDisplay', layout: 'wbw', continuous: true, customClasses: 'text-center direction-rtl', disallowedIn: ['supplications', 'bookmarks', 'morphology', 'juz', 'search'] },
	4: { displayID: 4, displayName: 'Continuous Normal', displayComponent: 'ContinuousDisplay', layout: 'normal', continuous: true, customClasses: 'text-center direction-rtl', disallowedIn: ['supplications', 'bookmarks', 'morphology', 'juz', 'search'] },
	5: { displayID: 5, displayName: 'Side By Side', displayComponent: 'SideBySideDisplay', layout: 'normal', continuous: false, customClasses: null, disallowedIn: ['supplications', 'bookmarks', 'morphology', 'juz', 'search'] },
	6: { displayID: 6, displayName: 'Mushaf', continuous: true, disallowedIn: ['supplications', 'bookmarks', 'morphology', 'juz', 'search'] },
	7: { displayID: 7, displayName: 'Translation/Transliteration', displayComponent: 'TranslationTransliteration', layout: 'wbw', continuous: false, customClasses: null, disallowedIn: ['morphology', 'search'] }
};

export const selectableFontTypes = {
	1: { id: 1, font: 'Uthmanic Hafs Digital', apiId: 1, disallowedIn: ['mushaf'] },
	2: { id: 2, font: 'Uthmanic Hafs Mushaf', apiId: 2, disallowedIn: [] },
	3: { id: 3, font: 'Uthmanic Hafs Tajweed Mushaf', apiId: 2, disallowedIn: [] },
	4: { id: 4, font: 'Indopak Madinah', apiId: 3, disallowedIn: ['mushaf'] }
};

export const themeColors = ['light', 'dark'];

export const selectableThemes = {
	1: {
		id: 1,
		name: 'Golden Glint',
		palette: 2,
		color: 'light',
		paletteNormal: 3,
		paletteTajweed: 0,
		paletteHeader: 2,
		color1: '#FFFFFF',
		color2: '#b1901f',
		color3: '#000000'
	},
	2: {
		id: 2,
		name: 'Classic Light',
		palette: 2,
		color: 'light',
		paletteNormal: 3,
		paletteTajweed: 0,
		paletteHeader: 0,
		color1: '#FFFFFF',
		color2: '#000000'
	},
	3: {
		id: 3,
		name: 'Silver Lining',
		palette: 1,
		color: 'light',
		paletteNormal: 5,
		paletteTajweed: 2,
		paletteHeader: 3,
		color1: '#e1e1e1',
		color2: '#000000'
	},
	4: {
		id: 4,
		name: 'Vintage Sepia',
		palette: 2,
		color: 'light',
		paletteNormal: 5,
		paletteTajweed: 2,
		paletteHeader: 5,
		color1: '#e9e3d7',
		color2: '#553c0f'
	},
	5: {
		id: 5,
		name: 'Mocha Night',
		palette: 1,
		color: 'dark',
		paletteNormal: 4,
		paletteTajweed: 1,
		paletteHeader: 5,
		color1: '#20161f',
		color2: '#c59f60'
	},
	6: {
		id: 6,
		name: 'Midnight Blue',
		palette: 1,
		color: 'dark',
		paletteNormal: 4,
		paletteTajweed: 1,
		paletteHeader: 3,
		color1: '#02021b',
		color2: '#c2c2c2'
	},
	7: {
		id: 7,
		name: 'Forest Green',
		palette: 1,
		color: 'dark',
		paletteNormal: 4,
		paletteTajweed: 1,
		paletteHeader: 1,
		color1: '#001617',
		color2: '#dddddd'
	},
	8: {
		id: 8,
		name: 'Oled Black',
		palette: 1,
		color: 'dark',
		paletteNormal: 4,
		paletteTajweed: 1,
		paletteHeader: 1,
		color1: '#000000',
		color2: '#dddddd'
	},
	9: {
		id: 9,
		name: 'Dark Luxury',
		palette: 1,
		color: 'dark',
		paletteNormal: 4,
		paletteTajweed: 1,
		paletteHeader: 1,
		color1: '#09090b',
		color2: '#dca54c'
	}
};

export const verseTranslationsLanguages = [
	{ language_id: 187, language: 'Albanian' },
	{ language_id: 20, language: 'Bangla' },
	{ language_id: 185, language: 'Chinese' },
	{ language_id: 34, language: 'Divehi' },
	{ language_id: 38, language: 'English' },
	{ language_id: 49, language: 'French' },
	{ language_id: 33, language: 'German' },
	{ language_id: 60, language: 'Hindi' },
	{ language_id: 67, language: 'Indonesian' },
	{ language_id: 106, language: 'Malayalam' },
	{ language_id: 43, language: 'Persian' },
	{ language_id: 138, language: 'Russian' },
	{ language_id: 142, language: 'Sindhi' },
	{ language_id: 158, language: 'Tamil' },
	{ language_id: 11115, language: 'Transliteration' },
	{ language_id: 167, language: 'Turkish' },
	{ language_id: 174, language: 'Urdu' }
];

export const rightToLeftVerseTranslations = [86, 840, 156, 97, 234, 158, 151, 54, 819, 135, 29, 238];

export const selectableVerseTranslations = {
	// albanian
	88: {
		resource_id: 88,
		resource_name: 'Hasan Efendi Nahi',
		language_id: 187
	},

	// bangla
	161: {
		resource_id: 161,
		resource_name: 'Taisirul Quran',
		language_id: 20
	},
	163: {
		resource_id: 163,
		resource_name: 'Sheikh Mujibur Rahman',
		language_id: 20
	},
	162: {
		resource_id: 162,
		resource_name: 'Rawai Al-bayan',
		language_id: 20
	},
	213: {
		resource_id: 213,
		resource_name: 'Dr. Abu Bakr Muhammad Zakaria',
		language_id: 20
	},

	// chinese
	56: {
		resource_id: 56,
		resource_name: 'Chinese Translation (Simplified) - Ma Jain',
		language_id: 185
	},
	109: {
		resource_id: 109,
		resource_name: 'Muhammad Makin',
		language_id: 185
	},

	// divehi
	86: {
		resource_id: 86,
		resource_name: 'Office of the president of Maldives',
		language_id: 34
	},
	840: {
		resource_id: 840,
		resource_name: 'Abu Bakr Ibrahim Ali (Bakurube)',
		language_id: 34
	},

	// english
	131: {
		resource_id: 131,
		resource_name: 'The Clear Quran (Mustafa Khattab)',
		language_id: 38
	},
	20: {
		resource_id: 20,
		resource_name: 'Saheeh International',
		language_id: 38
	},
	84: {
		resource_id: 84,
		resource_name: 'Mufti Taqi Usmani',
		language_id: 38
	},
	85: {
		resource_id: 85,
		resource_name: 'Abdel Haleem',
		language_id: 38
	},
	95: {
		resource_id: 95,
		resource_name: 'Abul Alaa Maududi',
		language_id: 38
	},
	19: {
		resource_id: 19,
		resource_name: 'Pickthall',
		language_id: 38
	},
	22: {
		resource_id: 22,
		resource_name: 'Yusuf Ali',
		language_id: 38
	},
	203: {
		resource_id: 203,
		resource_name: 'Hilali & Khan',
		language_id: 38
	},

	// french
	779: {
		resource_id: 779,
		resource_name: 'Rashid Maash',
		language_id: 49
	},
	136: {
		resource_id: 136,
		resource_name: 'Montada Islamic Foundation',
		language_id: 49
	},
	31: {
		resource_id: 31,
		resource_name: 'French Translation (Muhammad Hamidullah)',
		language_id: 49
	},

	// german
	208: {
		resource_id: 208,
		resource_name: 'Abu Reda Muhammad ibn Ahmad',
		language_id: 33
	},
	27: {
		resource_id: 27,
		resource_name: 'Frank Bubenheim and Nadeem',
		language_id: 33
	},

	// hindi
	122: {
		resource_id: 122,
		resource_name: 'Maulana Azizul Haque al-Umari',
		language_id: 60
	},

	// indonesian
	134: {
		resource_id: 134,
		resource_name: 'King Fahad Quran Complex',
		language_id: 67
	},
	33: {
		resource_id: 33,
		resource_name: 'Indonesian Islamic affairs ministry',
		language_id: 67
	},
	141: {
		resource_id: 141,
		resource_name: 'The Sabiq company',
		language_id: 67
	},

	// malayalam
	224: {
		resource_id: 224,
		resource_name: 'Abdul-Hamid Haidar & Kanhi Muhammad',
		language_id: 106
	},
	80: {
		resource_id: 80,
		resource_name: 'Muhammad Karakunnu and Vanidas Elayavoor',
		language_id: 106
	},
	37: {
		resource_id: 37,
		resource_name: 'Abdul Hameed and Kunhi',
		language_id: 106
	},

	// persian
	135: {
		resource_id: 135,
		resource_name: 'IslamHouse.com',
		language_id: 43
	},
	29: {
		resource_id: 29,
		resource_name: 'Hussein Taji Kal Dari',
		language_id: 43
	},

	// russian
	79: {
		resource_id: 79,
		resource_name: 'Abu Adel',
		language_id: 138
	},
	78: {
		resource_id: 78,
		resource_name: 'Ministry of Awqaf, Egypt',
		language_id: 138
	},
	45: {
		resource_id: 45,
		resource_name: 'Russian Translation ( Elmir Kuliev )',
		language_id: 138
	},

	// sindhi
	238: {
		resource_id: 238,
		resource_name: 'Taj Mehmood Amroti',
		language_id: 142,
		font: 'font-Sindhi'
	},

	// tamil
	229: {
		resource_id: 229,
		resource_name: 'Sheikh Omar Sharif bin Abdul Salam',
		language_id: 158
	},
	50: {
		resource_id: 50,
		resource_name: 'Jan Trust Foundation',
		language_id: 158
	},
	133: {
		resource_id: 133,
		resource_name: 'Abdul Hameed Baqavi',
		language_id: 158
	},

	// transliterations
	1: {
		resource_id: 1,
		resource_name: 'Transliteration (Tajweed)',
		language_id: 11115
	},
	3: {
		resource_id: 3,
		resource_name: 'Transliteration (Syllables)',
		language_id: 11115
	},
	// 57: {
	// 	resource_id: 57,
	// 	resource_name: 'Transliteration (Normal)',
	// 	language_id: 11115
	// },

	// turkish
	210: {
		resource_id: 210,
		resource_name: 'Dar Al-Salam Center',
		language_id: 167
	},
	77: {
		resource_id: 77,
		resource_name: 'Turkish Translation (Diyanet)',
		language_id: 167
	},
	52: {
		resource_id: 52,
		resource_name: 'Elmalili Hamdi Yazir',
		language_id: 167
	},
	112: {
		resource_id: 112,
		resource_name: 'Shaban Britch',
		language_id: 167
	},
	124: {
		resource_id: 124,
		resource_name: 'Muslim Shahin',
		language_id: 167
	},

	// urdu
	156: {
		resource_id: 156,
		resource_name: "Fe Zilal al-Qur'an",
		language_id: 174,
		font: 'font-Urdu'
	},
	97: {
		resource_id: 97,
		resource_name: 'Tafheem Ul Quran - Abul Alaa Maududi',
		language_id: 174,
		font: 'font-Urdu'
	},
	234: {
		resource_id: 234,
		resource_name: 'Fatah Muhammad Jalandhari',
		language_id: 174,
		font: 'font-Urdu'
	},
	158: {
		resource_id: 158,
		resource_name: 'بیان القرآن (ڈاکٹر اسرار احمد)',
		language_id: 174,
		font: 'font-Urdu'
	},
	151: {
		resource_id: 151,
		resource_name: 'Shaykh al-Hind Mahmud al-Hasan (with Tafsir E Usmani)',
		language_id: 174,
		font: 'font-Urdu'
	},
	54: {
		resource_id: 54,
		resource_name: 'Maulana Muhammad Junagarhi',
		language_id: 174,
		font: 'font-Urdu'
	},
	819: {
		resource_id: 819,
		resource_name: 'Maulana Wahiduddin Khan',
		language_id: 174,
		font: 'font-Urdu'
	},
	831: {
		resource_id: 831,
		resource_name: 'Abul Alaa Maududi (Roman Urdu)',
		language_id: 174
	}
};

export const selectableVerseTransliterations = [1, 3, 57];

export const selectableWordTranslations = {
	1: { id: 1, language: 'English' },
	2: { id: 2, language: 'Urdu', font: 'font-Urdu' },
	3: { id: 3, language: 'Hindi' },
	4: { id: 4, language: 'Indonesian' },
	5: { id: 5, language: 'Bangla' },
	6: { id: 6, language: 'Turkish' },
	7: { id: 7, language: 'Tamil' },
	8: { id: 8, language: 'German' },
	// 9: { id: 9, language: 'Russian' },
	// 10: { id: 10, language: 'Ingush' },
	11: { id: 11, language: 'French' },
	12: { id: 12, language: 'Malayalam (Amani Thafseer)' },
	13: { id: 13, language: 'Malayalam (Quran Lalithasaram)' },
	14: { id: 14, language: 'Chinese (Traditional)' },
	15: { id: 15, language: 'Chinese (Zhuyin)' },
	16: { id: 16, language: 'Chinese (Simplified)' },
	17: { id: 17, language: 'Chinese (Pinyin)' },
	18: { id: 18, language: 'Divehi' },
	// 19: { id: 19, language: 'Persian' },
	20: { id: 20, language: 'Sindhi', font: 'font-Sindhi' },
	21: { id: 21, language: 'Albanian' }
};

export const selectableWordTransliterations = {
	1: { id: 1, language: 'Normal Transliteration' },
	2: { id: 2, language: 'Tajweed Transliteration' }
};

export const selectableReciters = {
	1: {
		id: 1,
		timestampSlug: 'basit_mujawwad',
		reciter: 'Abdul Basit (Mujawwad)',
		url: 'https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps',
		image: 'abdul-baset-abdel-samad-medium.webp'
	},
	2: {
		id: 2,
		timestampSlug: 'basit_murattal',
		reciter: 'Abdul Basit (Murattal)',
		url: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
		image: 'abdul-baset-abdel-samad-medium.webp'
	},
	3: {
		id: 3,
		reciter: 'Abdul-Rahman Al-Sudais',
		url: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps',
		image: 'abdul-rahman-al-soudais-medium.webp'
	},
	4: {
		id: 4,
		reciter: 'Abu Bakr Ash-Shaatree',
		url: 'https://everyayah.com/data/Abu%20Bakr%20Ash-Shaatree_128kbps',
		image: 'abu-bakr-al-shatri-medium.webp'
	},
	5: {
		id: 5,
		reciter: 'Ayman Suwayd',
		url: 'https://everyayah.com/data/Ayman_Sowaid_64kbps',
		image: 'ayman-suwayd-medium.webp'
	},
	6: {
		id: 6,
		timestampSlug: 'rifai',
		reciter: 'Hani Ar-Rifai',
		url: 'https://everyayah.com/data/Hani_Rifai_192kbps',
		image: 'hani-ar-rifai-medium.webp'
	},
	7: {
		id: 7,
		reciter: 'Maher Al-Muaiqly',
		url: 'https://everyayah.com/data/MaherAlMuaiqly128kbps',
		image: 'maher-al-mueaqly-medium.webp'
	},
	8: {
		id: 8,
		timestampSlug: 'husary',
		reciter: 'Mahmoud Khalil Al-Husary',
		url: 'https://everyayah.com/data/Husary_128kbps',
		image: 'mahmoud-khalil-al-hussary-profile.webp'
	},
	9: {
		id: 9,
		reciter: 'Mahmoud Khalil Al-Husary (with gaps)',
		url: 'https://everyayah.com/data/Husary_Muallim_128kbps',
		image: 'mahmoud-khalil-al-hussary-profile.webp'
	},
	10: {
		id: 10,
		timestampSlug: 'mishary',
		reciter: 'Mishary Rashid Alafasy',
		url: 'https://everyayah.com/data/Alafasy_128kbps',
		image: 'mishary-rashid-alafasy-medium.webp'
	},
	11: {
		id: 11,
		reciter: 'Mohamed El-Minshawi (Mujawwad)',
		url: 'https://everyayah.com/data/Minshawy_Mujawwad_192kbps',
		image: 'mohammed-al-minshawi-hafs-an-assem-medium.webp'
	},
	12: {
		id: 12,
		reciter: 'Mohamed El-Minshawi (Teacher)',
		url: 'https://everyayah.com/data/Minshawy_Teacher_128kbps',
		image: 'mohammed-al-minshawi-hafs-an-assem-medium.webp'
	},
	13: {
		id: 13,
		reciter: 'Muhammad Ayyub',
		url: 'https://everyayah.com/data/Muhammad_Ayyoub_128kbps',
		image: 'mohamed-ayoub-medium.webp'
	},
	14: {
		id: 14,
		reciter: 'Nasser Al Qatami',
		url: 'https://everyayah.com/data/Nasser_Alqatami_128kbps',
		image: 'nasser-al-qatami-medium.webp'
	},
	15: {
		id: 15,
		timestampSlug: 'shuraym',
		reciter: 'Saood Ash-Shuraym',
		url: 'https://everyayah.com/data/Saood_ash-Shuraym_128kbps',
		image: 'saud-al-shuraim-medium.webp'
	},
	16: {
		id: 16,
		reciter: 'Yasser Ad-Dossari',
		url: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps',
		image: 'yasser-al-dosari-medium.webp'
	},
	17: {
		id: 17,
		reciter: 'Ibrahim Al Akhdar',
		url: 'https://everyayah.com/data/Ibrahim_Akhdar_32kbps',
		image: 'ibrahim-al-akhdar-medium.webp'
	},
	18: {
		id: 18,
		reciter: 'Khalifah Al Tunaiji',
		url: 'https://everyayah.com/data/khalefa_al_tunaiji_64kbps',
		image: 'khalifah-al-tunaiji-medium.webp'
	},
	19: {
		id: 19,
		reciter: 'Abdullah Matroud',
		url: 'https://everyayah.com/data/Abdullah_Matroud_128kbps',
		image: 'abdullah-matrood-medium.webp'
	},
	20: {
		id: 20,
		reciter: 'Ali Jaber',
		url: 'https://everyayah.com/data/Ali_Jaber_64kbps',
		image: 'ali-jaber-medium.webp'
	},
	21: {
		id: 21,
		reciter: 'Nabil Ar Rifay',
		url: 'https://everyayah.com/data/Nabil_Rifa3i_48kbps',
		image: 'nabil-al-rifay-medium.webp'
	}
};

export const selectableTranslationReciters = {
	1: { id: 1, reciter: 'English - Ibrahim Walk (Sahih International)', url: 'https://everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/' },
	2: { id: 2, reciter: 'Urdu - Dr. Farhat Hashmi (word by word)', url: 'https://everyayah.com/data/translations/urdu_farhat_hashmi/' },
	3: { id: 3, reciter: 'Urdu - Shamshad Ali Khan', url: 'https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/' }
};

export const selectablePlaybackSpeeds = {
	1: { id: 1, speed: 0.5 },
	2: { id: 2, speed: 0.75 },
	3: { id: 3, speed: 1 },
	4: { id: 4, speed: 1.25 },
	5: { id: 5, speed: 1.5 },
	6: { id: 6, speed: 1.75 },
	7: { id: 7, speed: 2 }
};

export const selectableTooltipOptions = {
	1: { id: 1, name: 'None' },
	2: { id: 2, name: 'Transliteration' },
	3: { id: 3, name: 'Translation' },
	4: { id: 4, name: 'Both' }
};

export const fontSizePresets = [null, 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
export const selectableFontSizes = {
	1: { id: 1, value: 'text-xs' },
	2: { id: 2, value: 'text-sm' },
	3: { id: 3, value: 'text-base' },
	4: { id: 4, value: 'text-lg' },
	5: { id: 5, value: 'text-xl' },
	6: { id: 6, value: 'text-2xl' },
	7: { id: 7, value: 'text-3xl' },
	8: { id: 8, value: 'text-4xl' },
	9: { id: 9, value: 'text-5xl' },
	10: { id: 10, value: 'text-6xl' },
	11: { id: 11, value: 'text-7xl' },
	12: { id: 12, value: 'text-8xl' }
};

export const screenBreakpoints = {
	sm: 640,
	md: 768,
	lg: 1024
};

export const selectableVersePlayButtonOptions = {
	1: { id: 1, name: 'Play Audio' },
	// 2: { id: 2, name: 'Play From That Verse' },
	3: { id: 3, name: 'Show Advanced Options' }
};
