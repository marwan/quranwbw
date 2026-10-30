import { writable } from 'svelte/store';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getAppleWebKitMajorVersion, getMushafOfflineFontVariants, getMushafWordFontLink, getMushafWordFontVariant } from './getMushafWordFontLink';
import { __fontType, __tajweedCompatibilityMode, __tajweedFontSupport, __websiteTheme } from '$utils/stores';

vi.mock('$utils/stores', () => ({
	__websiteTheme: writable(1),
	__fontType: writable(3),
	__tajweedFontSupport: writable(null),
	__tajweedCompatibilityMode: writable('auto')
}));

// user agents captured on BrowserStack real devices
const UA = {
	safariIOS27: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
	chromeIOS27: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.137 Mobile/15E148 Safari/604.1',
	safariIOS26: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
	safariIOS17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
	safariIPadOS27: 'Mozilla/5.0 (iPad; CPU OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
	chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
	chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
};

function mockDevice(userAgent, platform) {
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
	vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
}

afterEach(() => {
	vi.restoreAllMocks();
	__websiteTheme.set(1);
	__fontType.set(3);
	__tajweedFontSupport.set(null);
	__tajweedCompatibilityMode.set('auto');
});

describe('getAppleWebKitMajorVersion', () => {
	test('reads Safari "Version/" even though the OS version in the UA is frozen', () => {
		expect(getAppleWebKitMajorVersion(UA.safariIOS27)).toBe(27);
		expect(getAppleWebKitMajorVersion(UA.safariIOS26)).toBe(26);
		expect(getAppleWebKitMajorVersion(UA.safariIOS17)).toBe(17);
		expect(getAppleWebKitMajorVersion(UA.safariIPadOS27)).toBe(27);
	});

	test('reads the real iOS version for browsers without a "Version/" token', () => {
		expect(getAppleWebKitMajorVersion(UA.chromeIOS27)).toBe(27);
	});

	test('returns null when nothing identifies a WebKit version', () => {
		expect(getAppleWebKitMajorVersion(UA.chromeMac)).toBeNull();
	});
});

describe('getMushafWordFontLink with the Tajweed font', () => {
	test('Apple devices get COLRv1 by default and while the check is pending', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		expect(getMushafWordFontLink(2)).toContain('/COLRv1/QCF4002_COLOR-Regular.woff2?version=13');
		__tajweedFontSupport.set('colrv1');
		expect(getMushafWordFontLink(2)).toContain('/COLRv1/QCF4002_COLOR-Regular.woff2?version=13');
	});

	test('Apple devices get OT-SVG only when the check chose it', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedFontSupport.set('otsvg');
		expect(getMushafWordFontLink(2)).toContain('/OT-SVG-LIGHT/QCF4002_COLOR-Regular.woff2?version=2');
	});

	test('OT-SVG uses the light variant on light themes and the dark variant on dark themes', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedFontSupport.set('otsvg');
		for (const theme of [1, 2, 3, 4]) {
			__websiteTheme.set(theme);
			expect(getMushafWordFontVariant()).toBe('otsvgLight');
		}
		for (const theme of [5, 6, 7, 8, 9]) {
			__websiteTheme.set(theme);
			expect(getMushafWordFontVariant()).toBe('otsvgDark');
		}
		// the dark OT-SVG fonts are not on the CDN yet: same files as the light ones for now
		expect(getMushafWordFontLink(2)).toContain('/OT-SVG-LIGHT/QCF4002_COLOR-Regular.woff2?version=2');
	});

	test('a manual compatibility mode overrides the check result', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedCompatibilityMode.set('otsvg');
		expect(getMushafWordFontVariant()).toBe('otsvgLight');
		__tajweedFontSupport.set('otsvg');
		__tajweedCompatibilityMode.set('colrv1');
		expect(getMushafWordFontVariant()).toBe('colrv1');

		// back to auto: the check result is used again
		__tajweedCompatibilityMode.set('auto');
		expect(getMushafWordFontVariant()).toBe('otsvgLight');
	});

	test('OT-SVG is never used with non-Tajweed fonts or on non-Apple devices', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedFontSupport.set('otsvg');
		__tajweedCompatibilityMode.set('otsvg');
		__fontType.set(2);
		expect(getMushafWordFontLink(2)).toContain('/COLRv1/');
		__fontType.set(3);
		mockDevice(UA.chromeWindows, 'Win32');
		expect(getMushafWordFontLink(2)).toContain('/COLRv1/');
	});
});

describe('getMushafOfflineFontVariants', () => {
	const firefoxWindows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0';

	test('one shared COLRv1 file when both Mushaf fonts use it', () => {
		mockDevice(UA.chromeWindows, 'Win32');
		expect(getMushafOfflineFontVariants()).toEqual(['colrv1']);
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedFontSupport.set('colrv1');
		expect(getMushafOfflineFontVariants()).toEqual(['colrv1']);
	});

	test('the non-Tajweed COLRv1 and the Tajweed OT-SVG files when OT-SVG is used, whatever font is selected now', () => {
		mockDevice(UA.safariIOS26, 'iPhone');
		__tajweedFontSupport.set('otsvg');
		__fontType.set(2);
		expect(getMushafOfflineFontVariants()).toEqual(['colrv1', 'otsvgLight']);
		__websiteTheme.set(6);
		expect(getMushafOfflineFontVariants()).toEqual(['colrv1', 'otsvgDark']);
	});

	test('the Firefox dark-theme variants', () => {
		mockDevice(firefoxWindows, 'Win32');
		__websiteTheme.set(6);
		expect(getMushafOfflineFontVariants()).toEqual(['colrv1DarkFirefoxNonColored', 'colrv1DarkFirefox']);
	});
});
