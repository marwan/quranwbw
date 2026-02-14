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
	let basePath, fileName, fontVersion;

	// Use OT-SVG fonts on iOS/macOS for specific light themes (Golden Glint, Classic Light, Silver Lining) when using Mushaf Tajweed fonts
	// Certain iOS/macOS versions (notably iOS 26.2) have COLRv1 rendering bugs that cause incorrect or distorted colors, so OT-SVG is used as a fallback
	if (isIOSorMac && isAppleLightThemeWithoutCOLRv1Support && isTajweedFontType) {
		basePath = 'OT-SVG-LIGHT';
		fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
		fontVersion = 1;
	}

	// Firefox cannot correctly handle multiple COLRv1 palettes in dark themes, resulting in missing or incorrect colors
	// A dark-base COLRv1 font is used to ensure proper rendering
	else if (isFirefoxDarkTajweed()) {
		basePath = 'COLRv1-Dark-FF';
		fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
		fontVersion = 12;
	}

	// The default COLRv1 font is based on a light Tajweed palette, which causing visibility problems for non-Tajweed words in certain themes
	// A separate non-colored font variant is used as a workaround
	else if (isFirefoxDarkNonTajweed()) {
		basePath = 'COLRv1-Dark-FF-Non-Colored';
		fileName = `QCF4${paddedPage}_X-Regular.woff2`;
		fontVersion = 10;
	}

	// Use standard COLRv1 fonts for all platforms, themes, and font types when no platform-specific or browser-specific rendering issues apply
	else {
		basePath = 'COLRv1';
		fileName = `QCF4${paddedPage}_COLOR-Regular.woff2`;
		fontVersion = 12;
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
