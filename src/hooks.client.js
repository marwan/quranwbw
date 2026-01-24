/* eslint-disable no-prototype-builtins */
export const defaultSettings = {
	displaySettings: {
		websiteTheme: 1,
		displayType: 1,
		fontType: 1,
		wordTranslationEnabled: true,
		wordTransliterationEnabled: true,
		wordTooltip: 1,
		autoScrollSpeed: 40,
		wakeLockEnabled: false,
		englishTerminology: false,
		hideNonDuaPart: false,
		wordMorphologyOnClick: false,
		homepageExtrasPanelVisible: true,
		fontSizes: {
			arabicText: window.matchMedia('(min-width: 1280px)').matches || window.matchMedia('(min-width: 1024px)').matches || window.matchMedia('(min-width: 768px)').matches ? 'text-4xl' : 'text-2xl',
			wordTranslationText: 'text-sm',
			verseTranslationText: 'text-sm'
		},
		wideWesbiteLayoutEnabled: false,
		signLanguageModeEnabled: false
	},
	translations: {
		word: 1,
		verse_v1: [1, 131],
		tafsir: 30
	},
	transliteration: {
		word: 1
	},
	audioSettings: {
		reciter: 10,
		translationReciter: 1,
		playbackSpeed: 3,
		versePlayButton: 1,
		playFromWordOnClick: false,
		rememberSettings: true,
		audioType: 'verse',
		audioRange: 'playThisVerse',
		language: 'arabic',
		wordCountSize: 5,
		wordCountDelay: 4,
		timesToRepeat: 1,
		repeatType: 'repeatVerse',
		audioDelay: 1, // none
		savedPlaySettings: {}
	},
	quiz: {
		correctAnswers: 0,
		wrongAnswers: 0
	},
	lastRead: {},
	userBookmarks: [],
	userNotes: {},
	favouriteChapters: [1, 5, 18],
	chapter: 1,
	downloadedDataInfo: {},
	offlineSettings: {
		downloadEssentialData: true
	}
};

// Do not continue without setting the default user's settings first
(async function () {
	setUserSettings(defaultSettings);
})();

// This function updates user settings stored in localStorage by adding new settings from a provided object without replacing existing settings.
// It recursively processes the object, ensuring that only new keys are added, preserving existing values.
// If the userSettings object doesn't exist in localStorage, it initializes it with the provided object.
// This approach allows for seamless additions to the settings structure over time without overwriting current data.
export function setUserSettings(defaultSettings) {
	// Get existing settings from localStorage or initialize an empty object
	let existingSettings = localStorage.getItem('userSettings');
	existingSettings = existingSettings ? JSON.parse(existingSettings) : {};

	// Recursive function to add only new settings
	function addNewSettings(existing, incoming) {
		for (const key in incoming) {
			if (incoming.hasOwnProperty(key)) {
				if (typeof incoming[key] === 'object' && !Array.isArray(incoming[key])) {
					// If it's an object, recurse
					existing[key] = addNewSettings(existing[key] || {}, incoming[key]);
				} else {
					// Add the value only if the key doesn't exist in the existing settings
					if (!existing.hasOwnProperty(key)) {
						existing[key] = incoming[key];
					}
				}
			}
		}
		return existing;
	}

	// Add only new settings to the existing settings
	existingSettings = addNewSettings(existingSettings, defaultSettings);

	// Save the updated settings back to localStorage
	localStorage.setItem('userSettings', JSON.stringify(existingSettings));
}
