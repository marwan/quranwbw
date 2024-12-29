import { createLink } from '$utils/createLink';

export const websitechangelog = [
	{
		version: '4.1',
		date: 'Dec 29, 2024',
		description: [
			`In this update, we’ve enhanced audio playback with translation support and settings memory, introduced new reciters Ayman Suwayd and Ibrahim Al Akhdar, added custom chapter slugs for easy navigation, enabled simple Arabic verse copying, ensured verse translations display in your selected order, and added a button to listen to a word directly on the morphology page. Enjoy these fantastic enhancements!`
		],
		updates: [
			'<span class="font-semibold">Enhanced Audio Modal:</span> Now allows translation playback and remembers your settings. Say goodbye to repetitive adjustments!',
			'<span class="font-semibold">New Reciters:</span> We are excited to welcome Ayman Suwayd and Ibrahim Al Akhdar. Enjoy their melodious recitations!',
			`<span class="font-semibold">Custom Chapter Slugs:</span> Jump to any chapter using their translated, transliterated, or Arabic names. For example: ${createLink('https://quranwbw.com/cave', 'quranwbw.com/cave')}, ${createLink('https://quranwbw.com/yaseen', 'quranwbw.com/yaseen')}, ${createLink('https://quranwbw.com/هود', 'quranwbw.com/هود')}, ${createLink('https://quranwbw.com/baqarah', 'quranwbw.com/baqarah')}...`,
			'<span class="font-semibold">Effortless Verse Copying:</span> Added an option to copy Arabic verse text effortlessly. Perfect for sharing and making notes!',
			'<span class="font-semibold">Ordered Verse Translations:</span> Display verse translations in the sequence you selected. Enjoy a seamless reading experience!',
			'<span class="font-semibold">Morphology Page Audio:</span> Added a button to listen to a word directly on the morphology page for enhanced learning and pronunciation.'
		]
	},
	{
		version: '4.0.1',
		title: 'Shine with Golden Glint',
		date: 'Dec 7, 2024',
		description: [
			"Golden Glint has arrived, bringing a dazzling upgrade to our signature gold look. We've infused various elements with shimmering gold accents that'll make your reading experience feel extra special. Not on the new theme yet? No worries! Just head over to settings and switch to bask in the glow.",
			"But wait, there's more! We've polished up other themes and even added a couple of new ones for you to explore. Dive in and let your screen shine bright with our latest update!"
		]
	},
	{
		version: '4.0',
		title: 'Introducing QuranWBW v4.0',
		date: 'Dec 2, 2024',
		description: [
			'Alhamdulillah, we are thrilled to announce the release of QuranWBW v4, featuring a completely redesigned website with significant performance enhancements and a multitude of new and improved features.',
			`We hope you enjoy the new and improved QuranWBW experience! In case you'd still like to use the old website, you may visit ${createLink('https://old.quranwbw.com', 'old.quranwbw.com')}.`,
			'Here are the highlights of this update:'
		],
		updates: [
			'<span class="font-semibold">Expanded Language Options:</span> Word-by-word translations now available in Chinese, Divehi, French, German, Malayalam, and Persian.',
			'<span class="font-semibold">King Fahad Quran Printing Complex Fonts:</span> Includes Tajweed color-coded support based on Dar Al Marifa Easy Quran Mushaf.',
			'<span class="font-semibold">New Themes and Styles:</span> Fresh themes in Blue, Green, and Sepia, along with enhanced Light and Black themes.',
			'<span class="font-semibold">Tooltip and Popup Features:</span> Tooltips for word meanings and transliterations.',
			'<span class="font-semibold">Screen Sleep Prevention:</span> Option to prevent the screen from sleeping.',
			'<span class="font-semibold">Multiple Verse Translations:</span> Select multiple verse translations simultaneously, an improvement from the previous limit of two.',
			'<span class="font-semibold">Comprehensive Footnotes:</span> Added to verse translations across multiple translations.',
			'<span class="font-semibold">Tajweed Transliteration:</span> New Tajweed transliterations for verses and words, ensuring correct pronunciation.',
			'<span class="font-semibold">Tafsir Al Quran:</span> Access Tafsir by multiple authors in various languages.',
			'<span class="font-semibold">Flexible Display Options:</span> Includes Mushaf (page mode) and other display layouts.',
			'<span class="font-semibold">Verse Annotation:</span> Option to add personal notes to verses.',
			'<span class="font-semibold">Morphology Mode:</span> Provides detailed word information for learning and research.',
			'<span class="font-semibold">Sequential Word Playback:</span> Play words one-by-one for better learning.',
			'<span class="font-semibold">Terminology Customization:</span> Switch website terminologies to fit user preferences.',
			'<span class="font-semibold">Tajweed Rules Modal:</span> Learn about Tajweed rules on the fly without leaving the chapter reading.',
			'<span class="font-semibold">Translation Audio:</span> Experience translation audio alongside Arabic recitation.',
			'<span class="font-semibold">Direct Link Sharing:</span> Share links directly to a verse.',
			'<span class="font-semibold">Word Highlight Feature:</span> Expanded to include more reciters.',
			'<span class="font-semibold">Mini Status Bar:</span> Now displays progress and other relevant information.',
			'<span class="font-semibold">Redesigned Homepage:</span> Features two columns of chapter cards on smaller screens to reduce scrolling.',
			'<span class="font-semibold">Search Feature:</span> Enhanced with additional options.',
			'<span class="font-semibold">Duas Page:</span> Displays only the Dua portion of the verse in focus with the ability to hide non-Dua portions.',
			'<span class="font-semibold">Suggested Chapters:</span> Improved suggestions on the homepage.',
			'<span class="font-semibold">Bookmarks Page/Tab:</span> Enhanced appearance and management of bookmarks.',
			'<span class="font-semibold">Font Size and Recitation Speed Adjustment:</span> Improved user experience.',
			'<span class="font-semibold">Advanced Audio Play:</span> Enhanced audio play features.'
		]
	}
];
