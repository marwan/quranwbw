import { get } from 'svelte/store';
import { mushafWordFontLink } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme, __fontType } from '$utils/stores';

// Return the Mushaf font URL for a given page
export function getMushafWordFontLink(page) {
	const paddedPage = String(page).padStart(3, '0');
	const fontType = get(__fontType);

	let basePath;
	let fileName;
	let fontVersion;

	// KFGQPC v1
	if (fontType === 10) {
		basePath = 'Hafs/KFGQPC-v1';
		fileName = `p${page}.woff2`;
		fontVersion = 1;
	}

	// KFGQPC v2
	else if (fontType === 12) {
		basePath = 'Hafs/KFGQPC-v2';
		fileName = `p${page}.woff2`;
		fontVersion = 1;
	}

	// KFGQPC v4 (normal and tajweed)
	else if (fontType === 2 || fontType === 3) {
		if (isFirefoxDarkTajweed()) {
			basePath = 'Hafs/KFGQPC-v4/COLRv1-Dark-FF';
			fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
			fontVersion = 11;
		} else if (isFirefoxDarkNonTajweed()) {
			basePath = 'Hafs/KFGQPC-v4/COLRv1-Dark-FF-Non-Colored';
			fileName = `QCF4${paddedPage}_X-Regular.woff2`;
			fontVersion = 10;
		} else {
			basePath = 'Hafs/KFGQPC-v4/COLRv1';
			fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
			fontVersion = 11;
		}
	}

	// Indonesian Standard Mushaf
	else if (fontType === 11) {
		basePath = 'ISM/FONTS';
		fileName = `MSI_Z${paddedPage}-Regular.woff2`;
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
