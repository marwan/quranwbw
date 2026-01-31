/* eslint-disable no-case-declarations */
import { get } from 'svelte/store';
import {
	__currentPage,
	__userSettings,
	__fontType,
	__displayType,
	__websiteTheme,
	__wordTranslation,
	__wordTransliteration,
	__verseTranslations,
	__verseTafsir,
	__wordTranslationEnabled,
	__wordTransliterationEnabled,
	__reciter,
	__translationReciter,
	__playbackSpeed,
	__audioSettings,
	__lastRead,
	__wordTooltip,
	__userBookmarks,
	__autoScrollSpeed,
	__wakeLockEnabled,
	__userNotes,
	__quizCorrectAnswers,
	__quizWrongAnswers,
	__englishTerminology,
	__hideNonDuaPart,
	__playButtonsFunctionality,
	__wordMorphologyOnClick,
	__homepageExtrasPanelVisible,
	__wideWesbiteLayoutEnabled,
	__signLanguageModeEnabled,
	__offlineModeSettings
} from '$utils/stores';

// function to update website settings
export function updateSettings(props) {
	// get the settings from localStorage
	const userSettings = JSON.parse(localStorage.getItem('userSettings'));
	let trackEvent = false;
	// let uploadSettings = false;

	switch (props.type) {
		// for chapter number
		case 'chapter':
			userSettings.chapter = props.value;
			break;

		// for font types
		case 'fontType':
			__fontType.set(props.value);
			if (props.preventStoreUpdate) return;
			userSettings.displaySettings.fontType = props.value;
			trackEvent = true;
			break;

		// for display types
		case 'displayType':
			__displayType.set(props.value);
			if (props.preventStoreUpdate) return;
			userSettings.displaySettings.displayType = props.value;
			if (!props.skipTrackEvent) trackEvent = true;
			break;

		// for word tooltip
		case 'wordTooltip':
			__wordTooltip.set(props.value);
			userSettings.displaySettings.wordTooltip = props.value;
			trackEvent = true;
			break;

		// for terminologies language
		case 'englishTerminology':
			__englishTerminology.set(props.value);
			userSettings.displaySettings.englishTerminology = props.value;
			trackEvent = true;
			location.reload();
			break;

		// for website theme
		case 'websiteTheme':
			__websiteTheme.set(props.value);
			userSettings.displaySettings.websiteTheme = props.value;
			trackEvent = true;
			location.reload();
			break;

		// for word translation view
		case 'wordTranslationEnabled':
			__wordTranslationEnabled.set(props.value);
			userSettings.displaySettings.wordTranslationEnabled = props.value;
			break;

		// for word transliteration view
		case 'wordTransliterationEnabled':
			__wordTransliterationEnabled.set(props.value);
			userSettings.displaySettings.wordTransliterationEnabled = props.value;
			break;

		// for word translation
		case 'wordTranslation':
			__wordTranslation.set(props.value);
			userSettings.translations.word = props.value;
			trackEvent = true;
			break;

		// for word transliteration
		case 'wordTransliteration':
			__wordTransliteration.set(props.value);
			userSettings.transliteration.word = props.value;
			trackEvent = true;
			break;

		// for verse translations
		case 'verseTranslation':
			let verseTranslations = userSettings.translations.verse_v1;

			// if the translation already exists, then remove it, else add it
			verseTranslations.includes(props.value) ? (verseTranslations = verseTranslations.filter((x) => x !== props.value)) : verseTranslations.push(props.value);

			// update the verse translations
			userSettings.translations.verse_v1 = verseTranslations;
			__verseTranslations.set(verseTranslations);

			break;

		// for verse tafsir
		case 'verseTafsir':
			__verseTafsir.set(props.value);
			userSettings.translations.tafsir = props.value;
			trackEvent = true;
			break;

		// for verse reciter
		case 'reciter':
			__reciter.set(props.value);
			userSettings.audioSettings.reciter = props.value;
			trackEvent = true;
			break;

		// for translation reciter
		case 'translationReciter':
			__translationReciter.set(props.value);
			userSettings.audioSettings.translationReciter = props.value;
			trackEvent = true;
			break;

		// for playback speed
		case 'playbackSpeed':
			__playbackSpeed.set(props.value);
			userSettings.audioSettings.playbackSpeed = props.value;
			break;

		// for audio settings
		case 'audioSettings':
			__audioSettings.set(props.value);
			userSettings.audioSettings = props.value;
			break;

		case 'userBookmarks':
			const key = props.key;
			let userBookmarks = userSettings['userBookmarks'];

			// if override key was set, then just set the value key in localStorage
			if (props.override) {
				userSettings.userBookmarks = key;
			}

			// else just set what was provided as key invidually post validation
			else {
				// for old imports, only push if bookmark doesn't exist
				if (props.oldCheck) {
					if (!userBookmarks.includes(key)) userBookmarks.push(key);
				}

				// for existing bookmarks...
				// if the bookmark (key) already exists, then remove it, else add it
				else userBookmarks.includes(key) ? (userBookmarks = userBookmarks.filter((x) => x !== key)) : userBookmarks.push(key);

				// update the bookmarks
				userSettings.userBookmarks = userBookmarks;
			}

			__userBookmarks.set(userBookmarks);
			break;

		case 'userNotes':
			const value = props.value;
			const notes_key = props.key;
			const isWhitespaceString = (str) => !str.replace(/\s/g, '').length;
			let userNotes = userSettings['userNotes'];

			// if override key was set, then just set the value key in localStorage
			if (props.override) {
				userSettings.userNotes = notes_key;
			}

			// else just set what was provided as key invidually post validation
			else {
				// we only save the note if it's not just only whitespace
				if (!isWhitespaceString(value)) {
					userNotes[notes_key] = {
						note: value,
						modified_at: new Date().toISOString()
					};
				} else if (value.length === 0) {
					if (Object.prototype.hasOwnProperty.call(userNotes, notes_key)) delete userNotes[notes_key];
				}

				// update the notes
				userSettings.userNotes = userNotes;
			}

			__userNotes.set(userNotes);
			break;

		// for last read
		case 'lastRead':
			if (['chapter', 'mushaf', 'juz'].includes(get(__currentPage))) {
				const data = props.value;
				data['currentPage'] = get(__currentPage);
				__lastRead.set(data);
				userSettings.lastRead = props.value;
			}
			break;

		// for auto scroll
		case 'autoScrollSpeed':
			__autoScrollSpeed.set(props.value);
			userSettings.displaySettings.autoScrollSpeed = props.value;
			break;

		// for toggling wakeLock
		case 'wakeLockEnabled':
			__wakeLockEnabled.set(props.value);
			userSettings.displaySettings.wakeLockEnabled = props.value;
			break;

		// for toggling non-dua words
		case 'hideNonDuaPart':
			__hideNonDuaPart.set(props.value);
			userSettings.displaySettings.hideNonDuaPart = props.value;
			break;

		// for quiz correct answers
		case 'quizCorrectAnswers':
			__quizCorrectAnswers.set(props.value);
			userSettings.quiz.correctAnswers = props.value;
			break;

		// for quiz wrong answers
		case 'quizWrongAnswers':
			__quizWrongAnswers.set(props.value);
			userSettings.quiz.wrongAnswers = props.value;
			break;

		// for verse play button
		case 'versePlayButton':
			__playButtonsFunctionality.set({
				verse: props.value,
				toolbar: 1
			});
			userSettings.audioSettings.versePlayButton = props.value;
			break;

		// for toggling word morphology on click
		case 'wordMorphologyOnClick':
			__wordMorphologyOnClick.set(props.value);
			userSettings.displaySettings.wordMorphologyOnClick = props.value;
			break;

		// for homepage's extras panel
		case 'homepageExtrasPanelVisible':
			__homepageExtrasPanelVisible.set(props.value);
			userSettings.displaySettings.homepageExtrasPanelVisible = props.value;
			break;

		// for toggling website wide layout
		case 'wideWesbiteLayoutEnabled':
			__wideWesbiteLayoutEnabled.set(props.value);
			userSettings.displaySettings.wideWesbiteLayoutEnabled = props.value;
			break;

		// for toggling sign language mode
		case 'signLanguageModeEnabled':
			__signLanguageModeEnabled.set(props.value);
			userSettings.displaySettings.signLanguageModeEnabled = props.value;
			break;

		// for offline mode settings
		case 'offlineModeSettings':
			__offlineModeSettings.set(props.value);
			userSettings.offlineModeSettings = props.value;
			break;

		// for increasing/decreasing font sizes
		case 'arabicText': // Arabic words
		case 'wordTranslationText': // word translations & transliterations
		case 'verseTranslationText': // verse translations & transliterations
			// change the font size for each 'element'
			document.querySelectorAll(`.${props.type}`).forEach((element) => {
				const currentSize = element.getAttribute('data-fontSize');

				// set the new index and size
				let newSize = props.value;

				// perform the action
				if (newSize !== undefined) {
					// remove the current class
					element.classList.remove(currentSize);

					// add the new class
					element.classList.add(newSize);

					// update the attribute
					element.setAttribute('data-fontSize', newSize);

					// update it in localSettings
					userSettings.displaySettings.fontSizes[`${props.type}`] = newSize;
				}
			});
			break;
	}

	// Track event change
	if (trackEvent) {
		// window.umami.track('Setting Change', { type: props.type, value: props.value });
	}

	// update the settings back into localStorage and global store
	__userSettings.set(JSON.stringify(userSettings));
	localStorage.setItem('userSettings', JSON.stringify(userSettings));
}
