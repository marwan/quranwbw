import { updateSettings } from '$utils/updateSettings';
import { selectableDisplays, selectableFontTypes, selectableThemes, selectableWordTranslations } from '$data/options';

const params = new URLSearchParams(window.location.search);

const fontType = +params.get('fontType');
const displayType = +params.get('displayType');
const websiteTheme = +params.get('websiteTheme');
const wordTranslation = +params.get('wordTranslation');

// word_type
if (fontType !== null && selectableFontTypes[fontType] !== undefined) {
	updateSettings({ type: 'fontType', value: fontType });
}

// display_type
if (displayType !== null && selectableDisplays[displayType] !== undefined) {
	updateSettings({ type: 'displayType', value: displayType });
}

// website_theme
if (websiteTheme !== null && selectableThemes[websiteTheme] !== undefined) {
	updateSettings({ type: 'websiteTheme', value: websiteTheme });
}

// word_translation
if (wordTranslation !== null && selectableWordTranslations[wordTranslation] !== undefined) {
	updateSettings({ type: 'wordTranslation', value: wordTranslation });
}
