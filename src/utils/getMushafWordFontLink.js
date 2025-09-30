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

	// KFGQPC v4
	if ([2, 3].includes(get(__fontType))) {
		if (isFirefoxDarkTajweed()) {
			basePath = 'KFGQPC-v4/COLRv1-Dark-FF';
			fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
			fontVersion = 11;
		} else if (isFirefoxDarkNonTajweed()) {
			basePath = 'KFGQPC-v4/COLRv1-Dark-FF-Non-Colored';
			fileName = `QCF4${paddedPage}_X-Regular.woff2`;
			fontVersion = 10;
		} else {
			basePath = 'KFGQPC-v4/COLRv1';
			fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
			fontVersion = 11;
		}
	}

	// KFGQPC v1
	else {
		basePath = 'KFGQPC-v1';
		fileName = `p${page}.woff2`;
		fontVersion = 1;
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
