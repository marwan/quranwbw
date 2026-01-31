import { browser } from '$app/environment';
import { writable } from 'svelte/store';

let __currentPage,
	__chapterNumber,
	__pageNumber,
	__chapterData,
	__verseTranslationData,
	__verseKey,
	__userSettings,
	__userNotes,
	__userBookmarks,
	__fontType,
	__wordTranslation,
	__wordTransliteration,
	__verseTranslations,
	__verseTafsir,
	__wordTranslationEnabled,
	__wordTransliterationEnabled,
	__reciter,
	__translationReciter,
	__playbackSpeed,
	__displayType,
	__websiteTheme,
	__lastRead,
	__favouriteChapters,
	__pageURL,
	__settingsDrawerHidden,
	__topNavbarVisible,
	__bottomToolbarVisible,
	__mushafPageDivisions,
	__wordTooltip,
	__bottomAlert,
	__audioSettings,
	__morphologyKey,
	__autoScrollSpeed,
	__firstVerseOnPage,
	__audioModalVisible,
	__notesModalVisible,
	__tajweedRulesModalVisible,
	__tafsirModalVisible,
	__quranNavigationModalVisible,
	__siteNavigationModalVisible,
	__settingsSelectorModal,
	__lexiconModalVisible,
	__verseTranslationModalVisible,
	__morphologyModalVisible,
	__copyShareVerseModalVisible,
	__confirmationAlertModal,
	__wakeLockEnabled,
	__quizCorrectAnswers,
	__quizWrongAnswers,
	__timeSpecificChapters,
	__englishTerminology,
	__hideNonDuaPart,
	__wordRoot,
	__playButtonsFunctionality,
	__mushafMinimalModeEnabled,
	__keysToFetch,
	__wordMorphologyOnClick,
	__homepageExtrasPanelVisible,
	__wideWesbiteLayoutEnabled,
	__signLanguageModeEnabled,
	__verseWordBlocks,
	__offlineModeSettings;

if (browser) {
	const userSettings = JSON.parse(localStorage.getItem('userSettings'));

	// to store the current page
	__currentPage = writable('home');

	// to store the chapter number
	__chapterNumber = writable(1);

	// to store the page number
	__pageNumber = writable(1);

	// to store the chapter data fetched from the CDN
	__chapterData = writable(null);

	// to store the verse translation data fetch from Quran.com's API
	__verseTranslationData = writable(null);

	// to store the verse key
	__verseKey = writable('1:1');

	// to store the local user settings from LocalStorage
	__userSettings = writable(JSON.stringify(userSettings));

	// to store the user notes
	__userNotes = writable(userSettings.userNotes);

	// to store the user bookmarks
	__userBookmarks = writable(userSettings.userBookmarks);

	// to store the font type - Uthmani, IndoPak, etc...
	__fontType = writable(userSettings.displaySettings.fontType);

	// to store the word translation
	__wordTranslation = writable(userSettings.translations.word);

	// to store the word transliteration
	__wordTransliteration = writable(userSettings.transliteration.word);

	// to store the verse translations
	__verseTranslations = writable(userSettings.translations.verse_v1);

	// to store the verse tafisr
	__verseTafsir = writable(userSettings.translations.tafsir);

	// to store the word translation toggle
	__wordTranslationEnabled = writable(userSettings.displaySettings.wordTranslationEnabled);

	// to store the word transliteration toggle
	__wordTransliterationEnabled = writable(userSettings.displaySettings.wordTransliterationEnabled);

	// to store reciter
	__reciter = writable(userSettings.audioSettings.reciter);
	__translationReciter = writable(userSettings.audioSettings.translationReciter);

	// to store playback speed
	__playbackSpeed = writable(userSettings.audioSettings.playbackSpeed);

	// to store the display type - WBW, Normal, Continuous, etc...
	__displayType = writable(userSettings.displaySettings.displayType);

	// to store the website theme
	__websiteTheme = writable(userSettings.displaySettings.websiteTheme);

	// to store the last read key
	__lastRead = writable(userSettings.lastRead);

	// to store the user's favourite chapters
	__favouriteChapters = writable(userSettings.favouriteChapters);

	// to store a random number (for now) when changing verses due to some issues while re-rendering the component (probably because I'm still learning Svelte)
	__pageURL = writable(null);

	// to store the toggle boolean settings drawer
	__settingsDrawerHidden = writable(true);

	// to store the toggle boolean for top navbar,
	__topNavbarVisible = writable(true);

	// to store the toggle boolean for bottom navbar
	__bottomToolbarVisible = writable(true);

	// to store the chapters and juz info of a mushaf page
	__mushafPageDivisions = writable(null);

	// to store the word tooltip type
	__wordTooltip = writable(userSettings.displaySettings.wordTooltip);

	// to store all the audio settings
	__audioSettings = writable(userSettings.audioSettings);

	// to store the morphology verse/word key
	__morphologyKey = writable(null);

	// to store the auto scroll speed
	__autoScrollSpeed = writable(userSettings.displaySettings.autoScrollSpeed);

	// to store the first verse on page
	__firstVerseOnPage = writable(1);

	// modals & drawers ===============
	__audioModalVisible = writable(false);
	__notesModalVisible = writable(false);
	__tajweedRulesModalVisible = writable(false);
	__tafsirModalVisible = writable(false);
	__quranNavigationModalVisible = writable(false);
	__siteNavigationModalVisible = writable(false);
	__settingsSelectorModal = writable({
		visible: false
	});
	__lexiconModalVisible = writable(false);
	__verseTranslationModalVisible = writable(false);
	__morphologyModalVisible = writable(false);
	__copyShareVerseModalVisible = writable(false);
	__confirmationAlertModal = writable({
		visible: false,
		type: null,
		message: '',
		initiatedBy: null,
		onConfirm: null
	});

	// wake lock settings
	__wakeLockEnabled = writable(userSettings.displaySettings.wakeLockEnabled);

	// quiz settings
	__quizCorrectAnswers = writable(userSettings.quiz.correctAnswers);
	__quizWrongAnswers = writable(userSettings.quiz.wrongAnswers);

	// for al-kahf on friday and al-mulk at night
	__timeSpecificChapters = writable({
		isFriday: false,
		isNight: false
	});

	// english/arabic Quranic terms
	__englishTerminology = writable(userSettings.displaySettings.englishTerminology);

	// show/hide non-dua words
	__hideNonDuaPart = writable(userSettings.displaySettings.hideNonDuaPart);

	// to store the word root for showing lexicon data
	__wordRoot = writable(null);

	// functionalities of the play buttons
	__playButtonsFunctionality = writable({
		verse: 1, // default is "play this verse"
		toolbar: 1 // default is "play from start"
	});

	// used to hide elements on pinch
	__mushafMinimalModeEnabled = writable(false);

	// storing the total keys to fetch by Individual component
	__keysToFetch = writable(null);

	// what happens when a user clicks on a word
	__wordMorphologyOnClick = writable(userSettings.displaySettings.wordMorphologyOnClick);

	// visibiliy of the extras panel on homepage (bookmarks, notes, etc...)
	__homepageExtrasPanelVisible = writable(userSettings.displaySettings.homepageExtrasPanelVisible);

	// to store the website wide layout option
	__wideWesbiteLayoutEnabled = writable(userSettings.displaySettings.wideWesbiteLayoutEnabled);

	// to store the sign language mode option
	__signLanguageModeEnabled = writable(userSettings.displaySettings.signLanguageModeEnabled);

	// to store the visibility state of word blocks per verse
	__verseWordBlocks = writable({});

	// to store all the offline mode settings
	__offlineModeSettings = writable(userSettings.offlineModeSettings);
}

export {
	__currentPage,
	__chapterNumber,
	__pageNumber,
	__chapterData,
	__verseTranslationData,
	__verseKey,
	__userSettings,
	__userNotes,
	__userBookmarks,
	__fontType,
	__wordTranslation,
	__wordTransliteration,
	__verseTranslations,
	__verseTafsir,
	__wordTranslationEnabled,
	__wordTransliterationEnabled,
	__reciter,
	__translationReciter,
	__playbackSpeed,
	__displayType,
	__websiteTheme,
	__lastRead,
	__favouriteChapters,
	__pageURL,
	__settingsDrawerHidden,
	__topNavbarVisible,
	__bottomToolbarVisible,
	__mushafPageDivisions,
	__wordTooltip,
	__bottomAlert,
	__audioSettings,
	__morphologyKey,
	__autoScrollSpeed,
	__firstVerseOnPage,
	__audioModalVisible,
	__notesModalVisible,
	__tajweedRulesModalVisible,
	__tafsirModalVisible,
	__quranNavigationModalVisible,
	__siteNavigationModalVisible,
	__settingsSelectorModal,
	__lexiconModalVisible,
	__verseTranslationModalVisible,
	__morphologyModalVisible,
	__copyShareVerseModalVisible,
	__confirmationAlertModal,
	__wakeLockEnabled,
	__quizCorrectAnswers,
	__quizWrongAnswers,
	__timeSpecificChapters,
	__englishTerminology,
	__hideNonDuaPart,
	__wordRoot,
	__playButtonsFunctionality,
	__mushafMinimalModeEnabled,
	__keysToFetch,
	__wordMorphologyOnClick,
	__homepageExtrasPanelVisible,
	__wideWesbiteLayoutEnabled,
	__signLanguageModeEnabled,
	__verseWordBlocks,
	__offlineModeSettings
};
