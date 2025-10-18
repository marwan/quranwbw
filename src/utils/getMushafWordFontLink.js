import { get } from 'svelte/store';
import { mushafWordFontLink } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme, __fontType } from '$utils/stores';

// Return the Mushaf font URL for a given page
export function getMushafWordFontLink(page) {
	// Validate page
	if (isNaN(page) || page < 1 || page > 604) return '';

	const paddedPage = String(page).padStart(3, '0');
	const fontType = get(__fontType);

	let basePath = '';
	let fileName = '';
	let fontVersion = 1;

	switch (fontType) {
		// KFGQPC v4
		case 2: // normal
		case 3: // tajweed
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
			break;

		// KFGQPC v1
		case 10:
			basePath = 'Hafs/KFGQPC-v1';
			fileName = `p${page}.woff2`;
			fontVersion = 1;
			break;

		// Indonesian Standar Mushaf
		case 11:
			basePath = 'ISM/FONTS';
			fileName = `MSI_Z${paddedPage}-Regular.woff2`;
			fontVersion = 2;
			break;

		// KFGQPC v2
		case 12:
			basePath = 'Hafs/KFGQPC-v2';
			fileName = `p${page}.woff2`;
			fontVersion = 1;
			break;

		default:
			return ''; // fallback if font type unknown
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
