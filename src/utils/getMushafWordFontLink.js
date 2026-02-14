import { get } from 'svelte/store';
import { mushafWordFontLink } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme, __fontType } from '$utils/stores';

// Returns the Mushaf word font URL for a given page number
export function getMushafWordFontLink(page) {
	const paddedPage = String(page).padStart(3, '0');
	const os = getOS();
	const isIOSorMac = os === 'iOS' || os === 'macOS';
	const isAppleLightThemeWithoutCOLRv1Support = [1, 2, 3].includes(get(__websiteTheme));
	const isTajweedFontType = get(__fontType) === 3;

	// Defaults
	let basePath = 'COLRv1';
	let fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
	let fontVersion = 12;

	if (isIOSorMac && isAppleLightThemeWithoutCOLRv1Support && isTajweedFontType) {
		basePath = 'OT-SVG-LIGHT';
		fontVersion = 1;
	} else if (isFirefoxDarkTajweed()) {
		basePath = 'COLRv1-Dark-FF';
	} else if (isFirefoxDarkNonTajweed()) {
		basePath = 'COLRv1-Dark-FF-Non-Colored';
		fileName = `QCF4${paddedPage}_X-Regular.woff2`;
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

// Detects the user's operating system using navigator.platform, user-agent client hints (if available), and userAgent fallback.
// credits: https://dev.to/webs95/detect-macos-ios-windows-android-and-linux-os-with-js-f7n
function getOS() {
	const userAgent = navigator.userAgent || '';
	const platform = navigator?.userAgentData?.platform || navigator.platform || '';

	// iOS detection (some iPadOS versions report as Mac)
	if (['iPhone', 'iPad', 'iPod'].indexOf(platform) !== -1 || (/Mac/.test(platform) && navigator.maxTouchPoints > 1)) {
		return 'iOS';
	}

	if (['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].indexOf(platform) !== -1) {
		return 'macOS';
	}

	if (['Win32', 'Win64', 'Windows', 'WinCE'].indexOf(platform) !== -1) {
		return 'Windows';
	}

	if (/Android/i.test(userAgent)) {
		return 'Android';
	}

	if (/Linux/i.test(platform)) {
		return 'Linux';
	}

	return null;
}
