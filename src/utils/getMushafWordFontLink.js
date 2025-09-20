import { get } from 'svelte/store';
import { mushafWordFontLink } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme, __fontType } from '$utils/stores';

// Return the Mushaf font URL for a given page
export function getMushafWordFontLink(page) {
	const paddedPage = String(page).padStart(3, '0');

	let basePath;
	let fileName;
	let fontVersion;

	if (isFirefoxDarkTajweed()) {
		basePath = 'COLRv1-Dark-FF';
		fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
		fontVersion = 10;
	} else if (isFirefoxDarkNonTajweed()) {
		basePath = 'COLRv1-Dark-FF-Non-Colored';
		fileName = `QCF4${paddedPage}_X-Regular.woff2`;
		fontVersion = 10;
	} else {
		basePath = 'COLRv1';
		fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
		fontVersion = 10;
	}

	return `${mushafWordFontLink}/${basePath}/${fileName}?version=${fontVersion}`;
}

export function isFirefox() {
	return navigator.userAgent.toLowerCase().includes('firefox');
}

function isDarkFirefox() {
	const theme = selectableThemes[get(__websiteTheme)];
	return isFirefox() && theme?.color === 'dark';
}

function isMushafFirefoxDark(fontType) {
	return isDarkFirefox() && get(__fontType) === fontType;
}

export function isFirefoxDarkNonTajweed() {
	return isMushafFirefoxDark(2);
}

export function isFirefoxDarkTajweed() {
	return isMushafFirefoxDark(3);
}
