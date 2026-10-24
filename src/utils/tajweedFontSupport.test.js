import { get, writable } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ensureTajweedFontSupport, getAppleOSVersionLabel, getTajweedFontSupportDetails, onTajweedFontTypeSelected, rerunTajweedFontCheck } from './tajweedFontSupport';
import { probeCOLRv1, probeOTSVG } from '$utils/tajweedFontProbe';
import { updateSettings } from '$utils/updateSettings';
import { showAlert } from '$utils/confirmationAlertHandler';
import { __fontType, __tajweedCompatibilityMode, __tajweedFontSupport } from '$utils/stores';

vi.mock('$utils/stores', () => ({
	__websiteTheme: writable(1),
	__fontType: writable(3),
	__tajweedFontSupport: writable(null),
	__tajweedCompatibilityMode: writable('auto'),
	__settingsDrawerHidden: writable(true)
}));
vi.mock('$utils/tajweedFontProbe', () => ({ probeCOLRv1: vi.fn(), probeOTSVG: vi.fn() }));
vi.mock('$utils/updateSettings', () => ({ updateSettings: vi.fn() }));
vi.mock('$utils/confirmationAlertHandler', () => ({ showAlert: vi.fn() }));

const UA = {
	safariIOS27: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
	safariIOS26: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1',
	chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
};

function mockDevice(userAgent, platform) {
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
	vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
}

const probe = (state) => ({ state, canvas: null, foreignObject: null, ratio: null, timings: {} });

beforeEach(() => {
	localStorage.clear();
	vi.spyOn(console, 'log').mockImplementation(() => {});
	mockDevice(UA.safariIOS26, 'iPhone');
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.mocked(probeCOLRv1).mockReset();
	vi.mocked(probeOTSVG).mockReset();
	vi.mocked(updateSettings).mockReset();
	vi.mocked(showAlert).mockReset();
	__fontType.set(3);
	__tajweedFontSupport.set(null);
	__tajweedCompatibilityMode.set('auto');
});

describe('ensureTajweedFontSupport', () => {
	test('WebKit 27+ uses COLRv1 without running the check', async () => {
		mockDevice(UA.safariIOS27, 'iPhone');
		expect(await ensureTajweedFontSupport()).toBe('colrv1');
		expect(probeCOLRv1).not.toHaveBeenCalled();
	});

	test('a correct COLRv1 rendering keeps COLRv1', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('ok'));
		expect(await ensureTajweedFontSupport()).toBe('colrv1');
		expect(probeOTSVG).not.toHaveBeenCalled();
	});

	test('bleeding or blank COLRv1 switches to OT-SVG when OT-SVG renders', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('ok'));
		expect(await ensureTajweedFontSupport()).toBe('otsvg');

		__tajweedFontSupport.set(null);
		localStorage.clear();
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('blank'));
		expect(await ensureTajweedFontSupport()).toBe('otsvg');
	});

	test('when neither format renders, switches to the non-Tajweed font and tells the user', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('blank'));
		expect(await ensureTajweedFontSupport()).toBe('none');
		expect(updateSettings).toHaveBeenCalledWith({ type: 'fontType', value: 2 });
		expect(showAlert).toHaveBeenCalledTimes(1);
	});

	test('caches the result per user agent and runs the check only once', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('ok'));
		await Promise.all([ensureTajweedFontSupport(), ensureTajweedFontSupport()]);
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);

		// new page load: store empty, result read back from localStorage
		__tajweedFontSupport.set(null);
		expect(await ensureTajweedFontSupport()).toBe('otsvg');
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);

		// browser update: different user agent, the check runs again
		__tajweedFontSupport.set(null);
		mockDevice(UA.safariIOS26.replace('Version/26.2', 'Version/26.4'), 'iPhone');
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('ok'));
		expect(await ensureTajweedFontSupport()).toBe('colrv1');
		expect(probeCOLRv1).toHaveBeenCalledTimes(2);
	});

	test('a failed check keeps COLRv1 and is not cached', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.mocked(probeCOLRv1).mockRejectedValue(new Error('offline'));
		expect(await ensureTajweedFontSupport()).toBe('colrv1');
		expect(localStorage.getItem('tajweedFontSupport')).toBeNull();
	});

	test('non-Apple devices and non-Tajweed fonts are not checked', async () => {
		mockDevice(UA.chromeWindows, 'Win32');
		expect(await ensureTajweedFontSupport()).toBeNull();
		mockDevice(UA.safariIOS26, 'iPhone');
		__fontType.set(2);
		expect(await ensureTajweedFontSupport()).toBeNull();
		expect(probeCOLRv1).not.toHaveBeenCalled();
		expect(get(__tajweedFontSupport)).toBeNull();
	});

	test('a manual compatibility mode is used as is, without check or fallback', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('blank'));

		__tajweedCompatibilityMode.set('otsvg');
		expect(await ensureTajweedFontSupport()).toBe('otsvg');
		__tajweedCompatibilityMode.set('colrv1');
		expect(await ensureTajweedFontSupport()).toBe('colrv1');

		// even a known 'none' result does not switch fonts in manual mode
		__tajweedFontSupport.set('none');
		expect(await ensureTajweedFontSupport()).toBe('colrv1');

		expect(probeCOLRv1).not.toHaveBeenCalled();
		expect(probeOTSVG).not.toHaveBeenCalled();
		expect(updateSettings).not.toHaveBeenCalled();
		expect(showAlert).not.toHaveBeenCalled();
	});

	test('switching back to auto reuses the cached check result', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('ok'));
		expect(await ensureTajweedFontSupport()).toBe('otsvg');

		__tajweedCompatibilityMode.set('colrv1');
		expect(await ensureTajweedFontSupport()).toBe('colrv1');
		expect(get(__tajweedFontSupport)).toBe('otsvg');

		// new page load in auto mode: read back from localStorage, no new check
		__tajweedCompatibilityMode.set('auto');
		__tajweedFontSupport.set(null);
		expect(await ensureTajweedFontSupport()).toBe('otsvg');
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);
	});

	test('a manual mode does not run anything for non-Tajweed fonts', async () => {
		__tajweedCompatibilityMode.set('otsvg');
		__fontType.set(2);
		expect(await ensureTajweedFontSupport()).toBeNull();
	});
});

describe('onTajweedFontTypeSelected', () => {
	test('runs the check and shows the compatibility mode tip only once per browser', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('ok'));
		await onTajweedFontTypeSelected();
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);
		expect(showAlert).toHaveBeenCalledTimes(1);
		expect(vi.mocked(showAlert).mock.calls[0][0]).toContain('iOS Tajweed compatibility mode');

		await onTajweedFontTypeSelected();
		expect(showAlert).toHaveBeenCalledTimes(1);
	});

	test('shows only the "not supported" alert when no format renders', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('blank'));
		await onTajweedFontTypeSelected();
		expect(showAlert).toHaveBeenCalledTimes(1);
		expect(vi.mocked(showAlert).mock.calls[0][0]).toContain('not supported');
		expect(localStorage.getItem('tajweedCompatibilityInfoShown')).toBeNull();
	});

	test('shows nothing on non-Apple devices, for non-Tajweed fonts or in manual mode', async () => {
		mockDevice(UA.chromeWindows, 'Win32');
		await onTajweedFontTypeSelected();
		mockDevice(UA.safariIOS26, 'iPhone');
		__fontType.set(2);
		await onTajweedFontTypeSelected();
		__fontType.set(3);
		__tajweedCompatibilityMode.set('otsvg');
		await onTajweedFontTypeSelected();
		expect(probeCOLRv1).not.toHaveBeenCalled();
		expect(showAlert).not.toHaveBeenCalled();
	});
});

describe('auto detection details and re-check', () => {
	test('labels the OS version from the user agent', () => {
		expect(getAppleOSVersionLabel(UA.safariIOS26)).toBe('iOS 26.2');
		expect(getAppleOSVersionLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0 Mobile/15E148 Safari/604.1')).toBe('iOS 27.0.0');
		expect(getAppleOSVersionLabel(UA.chromeWindows)).toBeNull();
	});

	test('keeps when and how the format was chosen, for the settings', async () => {
		expect(getTajweedFontSupportDetails()).toBeNull();
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('ok'));
		const before = Date.now();
		await ensureTajweedFontSupport();
		const details = getTajweedFontSupportDetails();
		expect(details).toMatchObject({ support: 'otsvg', method: 'check', osVersion: 'iOS 26.2' });
		expect(details.detectedAt).toBeGreaterThanOrEqual(before);

		// WebKit 27+: no check, but the choice is still recorded with its date
		localStorage.clear();
		__tajweedFontSupport.set(null);
		mockDevice(UA.safariIOS27, 'iPhone');
		await ensureTajweedFontSupport();
		expect(getTajweedFontSupportDetails()).toMatchObject({ support: 'colrv1', method: 'webkit27', osVersion: 'iOS 27.0' });
	});

	test('switching back to auto forgets the cached result and checks again', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('bleed'));
		vi.mocked(probeOTSVG).mockResolvedValue(probe('ok'));
		expect(await ensureTajweedFontSupport()).toBe('otsvg');
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);

		vi.mocked(probeCOLRv1).mockResolvedValue(probe('ok'));
		expect(await rerunTajweedFontCheck()).toBe('colrv1');
		expect(probeCOLRv1).toHaveBeenCalledTimes(2);
		expect(get(__tajweedFontSupport)).toBe('colrv1');
		expect(getTajweedFontSupportDetails().support).toBe('colrv1');
	});

	test('re-check is deferred when the Tajweed font is not in use', async () => {
		vi.mocked(probeCOLRv1).mockResolvedValue(probe('ok'));
		await ensureTajweedFontSupport();
		__fontType.set(2);
		expect(await rerunTajweedFontCheck()).toBeNull();
		expect(probeCOLRv1).toHaveBeenCalledTimes(1);
		expect(getTajweedFontSupportDetails()).toBeNull();
	});
});
