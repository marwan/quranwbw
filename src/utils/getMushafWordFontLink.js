import { get } from 'svelte/store';
import { mushafWordFontLink } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme, __fontType, __tajweedFontSupport, __tajweedCompatibilityMode } from '$utils/stores';

const mushafFontVariants = {
	colrv1: { basePath: 'COLRv1', fileSuffix: 'COLOR', version: 14 },
	otsvgLight: { basePath: 'OT-SVG-LIGHT', fileSuffix: 'COLOR', version: 3 },
	otsvgDark: { basePath: 'OT-SVG-DARK', fileSuffix: 'COLOR', version: 3 },
	colrv1DarkFirefox: { basePath: 'COLRv1-Dark-FF', fileSuffix: 'COLOR', version: 14 },
	colrv1DarkFirefoxNonColored: { basePath: 'COLRv1-Dark-FF-Non-Colored', fileSuffix: 'X', version: 10 }
};

// Returns the URL of one Mushaf font variant for a given page number
export function getMushafFontVariantLink(variant, page) {
	const { basePath, fileSuffix, version } = mushafFontVariants[variant];
	const paddedPage = String(page).padStart(3, '0');
	return `${mushafWordFontLink}/${basePath}/QCF4${paddedPage}_${fileSuffix}-Regular.woff2?version=${version}`;
}

// Returns the Tajweed color font format used on Apple devices: the one picked in the Tajweed compatibility mode setting,
// or in "auto" mode the result of ensureTajweedFontSupport() (null while unknown)
function getTajweedFontFormat() {
	const mode = get(__tajweedCompatibilityMode);
	return ['colrv1', 'otsvg'].includes(mode) ? mode : get(__tajweedFontSupport);
}

// Returns which Mushaf word font variant to use on this device. By default for the selected font type and theme;
// the offline download passes every font type and theme base explicitly to get all the files the device may need.
export function getMushafWordFontVariant(fontType = get(__fontType), darkTheme = isDarkTheme()) {
	const isTajweedFontType = fontType === 3;
	const isFirefoxWithDarkTheme = isFirefox() && darkTheme;

	// COLRv1 is the default everywhere. On iOS/macOS some versions render its Tajweed colors wrongly (bleeding, e.g. iOS 18.0–18.3, 26.2–26.3)
	// or not at all (iOS 17.0–17.1); ensureTajweedFontSupport() checks this once (or the user picks a format in the Tajweed compatibility mode setting)
	// and only then switches to the OT-SVG fonts matching the theme's light or dark base (Vintage Sepia uses the light ones). OT-SVG is not the default because it is blank on iOS 17.5 and 27.
	if (isAppleWebKit() && isTajweedFontType && getTajweedFontFormat() === 'otsvg') {
		return darkTheme ? 'otsvgDark' : 'otsvgLight';
	}

	// Firefox cannot correctly handle multiple COLRv1 palettes in dark themes, resulting in missing or incorrect colors
	// A dark-base COLRv1 font is used to ensure proper rendering
	if (isFirefoxWithDarkTheme && isTajweedFontType) {
		return 'colrv1DarkFirefox';
	}

	// The default COLRv1 font is based on a light Tajweed palette, which causing visibility problems for non-Tajweed words in certain themes
	// A separate non-colored font variant is used as a workaround
	if (isFirefoxWithDarkTheme && fontType === 2) {
		return 'colrv1DarkFirefoxNonColored';
	}

	// Use standard COLRv1 fonts for all platforms, themes, and font types when no platform-specific or browser-specific rendering issues apply
	return 'colrv1';
}

// Every Mushaf font variant the Mushaf view can use on this device, with any theme: the non-Tajweed (2) and Tajweed (3) fonts,
// and light or dark themes, may use different files (e.g. COLRv1, OT-SVG light and OT-SVG dark). Used by the offline download
// so both Mushaf fonts work offline, and the theme can be changed offline without downloading anything else.
export function getMushafOfflineFontVariants() {
	return [...new Set([false, true].flatMap((darkTheme) => [2, 3].map((fontType) => getMushafWordFontVariant(fontType, darkTheme))))];
}

// Returns the Mushaf word font URL for a given page number
export function getMushafWordFontLink(page) {
	return getMushafFontVariantLink(getMushafWordFontVariant(), page);
}

export function isFirefox() {
	return navigator.userAgent.toLowerCase().includes('firefox');
}

function isDarkTheme() {
	return selectableThemes[get(__websiteTheme)]?.color === 'dark';
}

function isDarkFirefox() {
	return isFirefox() && isDarkTheme();
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

	if (['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].indexOf(platform) !== -1) {
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

export function isIOS() {
	return getOS() === 'iOS';
}

export function isIOSorMac() {
	const os = getOS();
	return os === 'iOS' || os === 'macOS';
}

// Apple's WebKit engine, where the Tajweed color font issues happen: every iOS/iPadOS browser (they all use WebKit)
// and Safari on macOS. Chrome, Edge and Firefox on macOS use their own engines and are not affected.
export function isAppleWebKit() {
	const os = getOS();
	if (os === 'iOS') return true;
	const userAgent = navigator.userAgent;
	return os === 'macOS' && /Version\/[0-9.]+.*Safari\//.test(userAgent) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(userAgent);
}

// Returns the major version of Apple's WebKit from the user agent, or null when it cannot be read.
// Safari freezes the OS version in its user agent (iOS 27 still reports "iPhone OS 18_7") but exposes "Version/27.0".
// Other iOS browsers (Chrome "CriOS", Firefox "FxiOS", Edge "EdgiOS") have no "Version/" token but report the real iOS version.
export function getAppleWebKitMajorVersion(userAgent = navigator.userAgent) {
	const versions = [userAgent.match(/Version\/(\d+)/), userAgent.match(/(?:iPhone|CPU) OS (\d+)_/)].filter(Boolean).map((match) => Number(match[1]));
	return versions.length ? Math.max(...versions) : null;
}
