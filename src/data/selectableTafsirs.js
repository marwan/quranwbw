// https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/editions.json

export const verseTafsirLanguages = [
	{ id: 1, language: 'Arabic' },
	{ id: 2, language: 'Bangla' },
	{ id: 3, language: 'English' },
	{ id: 4, language: 'Russian' },
	{ id: 5, language: 'Urdu' }
];

export const selectableTafsirs = {
	// Arabic
	10: {
		id: 10,
		author: 'Hafiz Ibn Kathir',
		language: 'Arabic',
		name: 'Tafsir Ibn Kathir',
		slug: 'ar-tafsir-ibn-kathir',
		url: 1
	},
	11: {
		id: 11,
		author: 'Saddi',
		language: 'Arabic',
		name: 'Tafseer Al Saddi',
		slug: 'ar-tafseer-al-saddi',
		url: 1
	},
	12: {
		id: 12,
		author: 'Baghawy',
		language: 'Arabic',
		name: 'Tafseer Al-Baghawi',
		slug: 'ar-tafsir-al-baghawi',
		url: 1
	},
	13: {
		id: 13,
		author: 'Tanweer',
		language: 'Arabic',
		name: 'Tafseer Tanwir al-Miqbas',
		slug: 'ar-tafseer-tanwir-al-miqbas',
		url: 1
	},
	14: {
		id: 14,
		author: 'Waseet',
		language: 'Arabic',
		name: 'Tafsir Al Wasit',
		slug: 'ar-tafsir-al-wasit',
		url: 1
	},
	15: {
		id: 15,
		author: 'Tabari',
		language: 'Arabic',
		name: 'Tafsir al-Tabari',
		slug: 'ar-tafsir-al-tabari',
		url: 1
	},
	16: {
		id: 16,
		author: 'المیسر',
		language: 'Arabic',
		name: 'Tafsir Muyassar',
		slug: 'ar-tafsir-muyassar',
		url: 1
	},
	17: {
		id: 17,
		author: 'Qurtubi',
		language: 'Arabic',
		name: 'Tafseer Al Qurtubi',
		slug: 'ar-tafseer-al-qurtubi',
		url: 1
	},

	// Bangla
	20: {
		id: 20,
		author: 'AbdulRahman Bin Hasan Al-Alshaikh',
		language: 'Bangla',
		name: 'Tafsir Fathul Majid',
		slug: 'bn-tafisr-fathul-majid',
		url: 1
	},
	21: {
		id: 21,
		author: 'Tawheed Publication',
		language: 'Bangla',
		name: 'Tafseer ibn Kathir',
		slug: 'bn-tafseer-ibn-e-kaseer',
		url: 1
	},
	22: {
		id: 22,
		author: 'Bayaan Foundation',
		language: 'Bangla',
		name: 'Tafsir Ahsanul Bayaan',
		slug: 'bn-tafsir-ahsanul-bayaan',
		url: 1
	},
	23: {
		id: 23,
		author: 'King Fahd Quran Printing Complex',
		language: 'Bangla',
		name: 'Tafsir Abu Bakr Zakaria',
		slug: 'bn-tafsir-abu-bakr-zakaria',
		url: 1
	},

	// English
	30: {
		id: 30,
		author: 'Hafiz Ibn Kathir',
		language: 'English',
		name: 'Tafsir Ibn Kathir (abridged)',
		slug: 'en-tafisr-ibn-kathir',
		url: 1
	},

	31: {
		id: 31,
		author: 'Mufti Muhammad Shafi',
		language: 'English',
		name: 'Maarif-ul-Quran',
		slug: 'en-tafsir-maarif-ul-quran',
		url: 1
	},
	32: {
		id: 32,
		author: 'Maulana Wahid Uddin Khan',
		language: 'English',
		name: 'Tazkirul Quran',
		slug: 'en-tazkirul-quran',
		url: 1
	},
	33: {
		id: 33,
		author: 'Kashf Al-Asrar Tafsir',
		language: 'English',
		name: 'Kashf Al-Asrar Tafsir',
		slug: 'en-kashf-al-asrar-tafsir',
		url: 1
	},
	34: {
		id: 34,
		author: 'Al Qushairi Tafsir',
		language: 'English',
		name: 'Al Qushairi Tafsir',
		slug: 'en-al-qushairi-tafsir',
		url: 1
	},
	35: {
		id: 35,
		author: 'Kashani Tafsir',
		language: 'English',
		name: 'Kashani Tafsir',
		slug: 'en-kashani-tafsir',
		url: 1
	},
	36: {
		id: 36,
		author: 'Tafsir al-Tustari',
		language: 'English',
		name: 'Tafsir al-Tustari',
		slug: 'en-tafsir-al-tustari',
		url: 1
	},
	37: {
		id: 37,
		author: 'Asbab Al-Nuzul by Al-Wahidi',
		language: 'English',
		name: 'Asbab Al-Nuzul by Al-Wahidi',
		slug: 'en-asbab-al-nuzul-by-al-wahidi',
		url: 1
	},
	38: {
		id: 38,
		author: 'Tanwîr al-Miqbâs min Tafsîr Ibn ‘Abbâs',
		language: 'English',
		name: 'Tanwîr al-Miqbâs min Tafsîr Ibn ‘Abbâs',
		slug: 'en-tafsir-ibn-abbas',
		url: 1
	},
	39: {
		id: 39,
		author: 'Al-Jalalayn',
		language: 'English',
		name: 'Al-Jalalayn',
		slug: 'en-al-jalalayn',
		url: 1
	},

	// Russian
	50: {
		id: 50,
		author: 'Saddi',
		language: 'Russian',
		name: 'Tafseer Al Saddi',
		slug: 'ru-tafseer-al-saddi',
		url: 1
	},

	// Urdu
	60: {
		id: 60,
		author: 'Sayyid Ibrahim Qutb',
		language: 'Urdu',
		name: 'Fi Zilal al-Quran',
		slug: 'ur-tafsir-fe-zalul-quran-syed-qatab',
		url: 1,
		font: 'font-Urdu'
	},
	61: {
		id: 61,
		author: 'Hafiz Ibn Kathir',
		language: 'Urdu',
		name: 'Tafsir Ibn Kathir',
		slug: 'ur-tafseer-ibn-e-kaseer',
		url: 1,
		font: 'font-Urdu'
	},
	62: {
		id: 62,
		author: 'Dr. Israr Ahmad',
		language: 'Urdu',
		name: 'Tafsir Bayan ul Quran',
		slug: 'ur-tafsir-bayan-ul-quran',
		url: 1,
		font: 'font-Urdu'
	},
	63: {
		id: 63,
		author: 'Maulana Wahid Uddin Khan',
		language: 'Urdu',
		name: 'Tazkirul Quran',
		slug: 'ur-tazkirul-quran',
		url: 1,
		font: 'font-Urdu'
	},
	64: {
		id: 64,
		author: 'Syed Abul Ala Maududi',
		language: 'Urdu',
		name: 'Tafheem Ul Quran',
		slug: 'ur-tafheem-ul-quran',
		url: 2,
		font: 'font-Urdu'
	}
};
