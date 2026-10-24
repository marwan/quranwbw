import { get } from 'svelte/store';
import { __fontType, __tajweedFontSupport, __tajweedCompatibilityMode, __settingsDrawerHidden } from '$utils/stores';
import { getMushafFontVariantLink, getAppleWebKitMajorVersion, isIOSorMac } from '$utils/getMushafWordFontLink';
import { probeCOLRv1, probeOTSVG } from '$utils/tajweedFontProbe';
import { updateSettings } from '$utils/updateSettings';
import { showAlert } from '$utils/confirmationAlertHandler';

// Decides, once per browser version, which Tajweed color font format an Apple device can display:
//   WebKit 27+                        → 'colrv1' (no check: COLRv1 renders fine there, OT-SVG is blank)
//   COLRv1 renders correctly          → 'colrv1'
//   COLRv1 bleeds or is blank         → 'otsvg' when OT-SVG renders, otherwise 'none'
//   'none'                            → switch to the non-Tajweed Mushaf font and tell the user
// The result is cached in localStorage, keyed by the full user agent (browser + version + OS version),
// so a browser or iOS update runs the check again.
// The iOS Tajweed compatibility mode setting ('colrv1' | 'otsvg') skips the check entirely; getMushafWordFontLink() then uses
// that format directly, and the cached result is kept for when the setting goes back to 'auto'.

const STORAGE_KEY = 'tajweedFontSupport';
const CACHE_VERSION = 1;
const PROBE_PAGE = 2; // the check draws lines 10-11 of Mushaf page 2
const LOG_PREFIX = '[tajweed-fonts]';
const TAJWEED_FONT_TYPE = 3;
const NON_TAJWEED_FONT_TYPE = 2;
const INFO_SHOWN_STORAGE_KEY = 'tajweedCompatibilityInfoShown';

let pendingCheck = null;
let loggedManualMode = null;

function log(...args) {
	console.log(LOG_PREFIX, ...args);
}

function readCache() {
	try {
		const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (cached && cached.version === CACHE_VERSION && cached.userAgent === navigator.userAgent) return cached.support;
	} catch {
		// unreadable cache: run the check again
	}
	return null;
}

function writeCache(support) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CACHE_VERSION, userAgent: navigator.userAgent, support }));
	} catch {
		// storage full or unavailable: the check simply runs again next time
	}
}

async function detectSupport() {
	const webKitVersion = getAppleWebKitMajorVersion();
	log('user agent:', navigator.userAgent, '| WebKit major:', webKitVersion);

	if ((webKitVersion ?? 0) >= 27) {
		log('WebKit 27+ → colrv1 (no check needed)');
		return 'colrv1';
	}

	const cached = readCache();
	if (cached) {
		log('cached result →', cached);
		return cached;
	}

	const start = performance.now();
	try {
		const colrv1 = await probeCOLRv1(getMushafFontVariantLink('colrv1', PROBE_PAGE));
		log('COLRv1 check:', colrv1.state, '| canvas', colrv1.canvas, '| foreignObject', colrv1.foreignObject, '| foreignObject÷canvas colored share', colrv1.ratio === null ? 'n/a' : colrv1.ratio.toFixed(2), '| ms', colrv1.timings);

		let support = 'colrv1';
		if (colrv1.state !== 'ok') {
			const otsvg = await probeOTSVG(getMushafFontVariantLink('otsvgLight', PROBE_PAGE));
			log('OT-SVG check:', otsvg.state, '| foreignObject', otsvg.foreignObject, '| ms', otsvg.timings);
			support = otsvg.state === 'ok' ? 'otsvg' : 'none';
		}

		writeCache(support);
		log('result →', support, `(total ${Math.round(performance.now() - start)} ms)`);
		return support;
	} catch (error) {
		// network or decoding failure: keep the COLRv1 default and retry on the next page load (not cached)
		console.warn(LOG_PREFIX, 'check failed, using colrv1', error);
		window.rybbit?.error(error);
		return 'colrv1';
	}
}

// Stores the result; with 'none', moves a Tajweed user to the non-Tajweed Mushaf font and explains why
function applySupport(support) {
	__tajweedFontSupport.set(support);

	if (support === 'none' && get(__fontType) === TAJWEED_FONT_TYPE) {
		log('Tajweed colors cannot be displayed → switching to the non-Tajweed Mushaf font');
		updateSettings({ type: 'fontType', value: NON_TAJWEED_FONT_TYPE });
		showAlert('Tajweed fonts are not supported on your browser. Please try updating iOS.', get(__settingsDrawerHidden) ? '' : 'settings-drawer');
	}

	return support;
}

// Resolves once the Tajweed font format is known. Only Apple devices using the Tajweed Mushaf font are checked;
// everyone else resolves immediately and keeps the existing font selection.
// A format picked in the iOS Tajweed compatibility mode setting is used as is: no check and no 'none' fallback.
export function ensureTajweedFontSupport() {
	if (!isIOSorMac() || get(__fontType) !== TAJWEED_FONT_TYPE) return Promise.resolve(null);

	const mode = get(__tajweedCompatibilityMode);
	if (['colrv1', 'otsvg'].includes(mode)) {
		if (loggedManualMode !== mode) log('manual iOS Tajweed compatibility mode →', mode, '(no check)');
		loggedManualMode = mode;
		return Promise.resolve(mode);
	}
	loggedManualMode = null;

	const known = get(__tajweedFontSupport);
	if (known !== null) return Promise.resolve(applySupport(known));

	if (!pendingCheck) {
		pendingCheck = detectSupport()
			.then(applySupport)
			.finally(() => {
				pendingCheck = null;
			});
	}
	return pendingCheck;
}

// Called when the user selects the Tajweed Mushaf font in the settings: runs the check right away instead of waiting for
// the next page render, then (once per browser, in auto mode) points Apple users to the iOS Tajweed compatibility mode setting.
// The tip is skipped when the check found no working format, since the "not supported" alert is shown instead.
export async function onTajweedFontTypeSelected() {
	const support = await ensureTajweedFontSupport();
	if (support === null || support === 'none' || get(__tajweedCompatibilityMode) !== 'auto') return;

	try {
		if (localStorage.getItem(INFO_SHOWN_STORAGE_KEY)) return;
		localStorage.setItem(INFO_SHOWN_STORAGE_KEY, 'true');
	} catch {
		// storage unavailable: the tip may be shown again next time
	}

	showAlert('iPhones sometimes have issues with colored fonts. If you see an issue, you can manually change the iOS Tajweed compatibility mode in the settings.', get(__settingsDrawerHidden) ? '' : 'settings-drawer');
}
