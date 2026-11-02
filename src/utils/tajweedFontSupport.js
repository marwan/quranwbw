import { get } from 'svelte/store';
import { __fontType, __tajweedFontSupport, __tajweedCompatibilityMode, __settingsDrawerHidden } from '$utils/stores';
import { getMushafFontVariantLink, getAppleWebKitMajorVersion, isAppleWebKit, isIOS } from '$utils/getMushafWordFontLink';
import { probeCOLRv1, probeOTSVG } from '$utils/tajweedFontProbe';
import { updateSettings } from '$utils/updateSettings';
import { showAlert } from '$utils/confirmationAlertHandler';
import { readTajweedFontCacheEntry, readTajweedFontCache, writeTajweedFontCache, clearTajweedFontCache } from '$utils/tajweedFontCache';

// Decides, once per browser version, which Tajweed color font format an Apple device can display:
//   WebKit 27+                        → 'colrv1' (no check: COLRv1 renders fine there, OT-SVG is blank)
//   COLRv1 renders correctly          → 'colrv1'
//   COLRv1 bleeds, is blank or has no colors → 'otsvg' when OT-SVG renders, otherwise 'none'
//   'none'                            → switch to the non-Tajweed Mushaf font and tell the user
// The result is cached in localStorage, keyed by the full user agent (browser + version + OS version),
// so a browser or iOS update runs the check again.
// The Tajweed compatibility mode setting ('colrv1' | 'otsvg') skips the check entirely; getMushafWordFontLink() then uses
// that format directly, and the cached result is kept for when the setting goes back to 'auto'.

const PROBE_PAGE = 2; // the check draws lines 10-11 of Mushaf page 2
const LOG_PREFIX = '[tajweed-fonts]';
const TAJWEED_FONT_TYPE = 3;
const NON_TAJWEED_FONT_TYPE = 2;
const INFO_SHOWN_STORAGE_KEY = 'tajweedCompatibilityInfoShown';

// A check that has not settled after this long is abandoned: the page keeps the COLRv1 default for now
const PROBE_TIMEOUT_MS = 10000;
// After a failed or timed-out check, COLRv1 is used without checking again for this long (instead of on every rendered verse)
const RETRY_AFTER_FAILURE_MS = 60000;

let pendingCheck = null;
let lastFailedCheckAt = null;

function log(...args) {
	console.log(LOG_PREFIX, ...args);
}

// "iOS 26.3" / "macOS Safari 26.2" from the user agent: Safari's "Version/" token is the OS release (its "iPhone OS" token is frozen),
// other iOS browsers (Chrome, Firefox, Edge) report the real "iPhone OS 26_3" token
export function getAppleOSVersionLabel(userAgent = navigator.userAgent) {
	const safariVersion = (userAgent.match(/Version\/([0-9.]+)/) || [])[1];
	const iosVersion = ((userAgent.match(/(?:iPhone|CPU) OS ([0-9_]+)/) || [])[1] || '').replace(/_/g, '.');
	// iPads in desktop mode (the default) send a Mac user agent; a touch screen tells them apart from a Mac
	const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
	if (isIOSDevice) return `iOS ${safariVersion || iosVersion || '?'}`;
	return safariVersion ? `macOS Safari ${safariVersion}` : null;
}

// What auto detection found for this device, for the settings: { support, detectedAt, method, osVersion } or null when not checked yet
export function getTajweedFontSupportDetails() {
	const cached = readTajweedFontCacheEntry();
	if (!cached) return null;
	return { support: cached.support, detectedAt: cached.detectedAt || null, method: cached.method || 'check', osVersion: getAppleOSVersionLabel() };
}

function withTimeout(promise, ms) {
	let timer;
	const timeout = new Promise((_, reject) => {
		timer = setTimeout(() => reject(new Error(`Tajweed font check timed out after ${ms} ms`)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function detectSupport() {
	const webKitVersion = getAppleWebKitMajorVersion();
	log('user agent:', navigator.userAgent, '| WebKit major:', webKitVersion);

	if ((webKitVersion ?? 0) >= 27) {
		log('WebKit 27+ → colrv1 (no check needed)');
		// cached only so the settings can show when and how the format was chosen
		if (!readTajweedFontCacheEntry()) writeTajweedFontCache('colrv1', 'webkit-27-or-newer');
		return 'colrv1';
	}

	const cached = readTajweedFontCache();
	if (cached) {
		log('cached result →', cached);
		return cached;
	}

	const start = performance.now();
	try {
		const colrv1 = await withTimeout(probeCOLRv1(getMushafFontVariantLink('colrv1', PROBE_PAGE)), PROBE_TIMEOUT_MS);
		log('COLRv1 check:', colrv1.state, '| canvas', colrv1.canvas, '| foreignObject', colrv1.foreignObject, '| foreignObject÷canvas colored share', colrv1.ratio === null ? 'n/a' : colrv1.ratio.toFixed(2), '| ms', colrv1.timings);

		let support = 'colrv1';
		if (colrv1.state !== 'ok') {
			const otsvg = await withTimeout(probeOTSVG(getMushafFontVariantLink('otsvgLight', PROBE_PAGE)), PROBE_TIMEOUT_MS);
			log('OT-SVG check:', otsvg.state, '| foreignObject', otsvg.foreignObject, '| ms', otsvg.timings);
			support = otsvg.state === 'ok' ? 'otsvg' : 'none';
		}

		writeTajweedFontCache(support, 'check');
		log('result →', support, `(total ${Math.round(performance.now() - start)} ms)`);
		return support;
	} catch (error) {
		// network or decoding failure, or timeout: no result (nothing cached or stored), the caller falls back to COLRv1
		// and the check is retried later
		console.warn(LOG_PREFIX, 'check failed, using colrv1 for now', error);
		window.rybbit?.error(error);
		lastFailedCheckAt = Date.now();
		return null;
	}
}

// Stores the result; with 'none', moves a Tajweed user to the non-Tajweed Mushaf font and explains why
function applySupport(support) {
	__tajweedFontSupport.set(support);

	if (support === 'none' && get(__fontType) === TAJWEED_FONT_TYPE) {
		log('Tajweed colors cannot be displayed → switching to the non-Tajweed Mushaf font');
		updateSettings({ type: 'fontType', value: NON_TAJWEED_FONT_TYPE });
		showAlert(`Tajweed fonts are not supported on your browser. Please try updating ${isIOS() ? 'iOS' : 'macOS'}.`, get(__settingsDrawerHidden) ? '' : 'settings-drawer');
	}

	return support;
}

// Resolves once the Tajweed font format is known. Only Apple devices using the Tajweed Mushaf font are checked;
// everyone else resolves immediately and keeps the existing font selection.
// anyFontType checks even when another font is selected (the offline download needs the Tajweed font files either way).
// A format picked in the Tajweed compatibility mode setting is used as is: no check and no 'none' fallback.
export function ensureTajweedFontSupport({ anyFontType = false } = {}) {
	if (!isAppleWebKit() || (!anyFontType && get(__fontType) !== TAJWEED_FONT_TYPE)) return Promise.resolve(null);

	const mode = get(__tajweedCompatibilityMode);
	if (['colrv1', 'otsvg'].includes(mode)) return Promise.resolve(mode);

	const known = get(__tajweedFontSupport);
	if (known !== null) return Promise.resolve(applySupport(known));

	// a check failed a moment ago: keep the COLRv1 default for now rather than checking again for every rendered verse
	if (!pendingCheck && lastFailedCheckAt !== null && Date.now() - lastFailedCheckAt < RETRY_AFTER_FAILURE_MS) return Promise.resolve('colrv1');

	if (!pendingCheck) {
		const check = detectSupport()
			// failed check: COLRv1 for this caller only, so a later call can check again
			.then((support) => (support === null ? 'colrv1' : applySupport(support)))
			.finally(() => {
				if (pendingCheck === check) pendingCheck = null;
			});
		pendingCheck = check;
	}
	return pendingCheck;
}

// Forgets the cached result and checks again (when the user switches the Tajweed compatibility mode back to auto).
// The check itself only runs if the Tajweed Mushaf font is in use; otherwise it runs the next time it is selected.
export function rerunTajweedFontCheck() {
	log('auto mode selected → forgetting the cached result and checking again');
	lastFailedCheckAt = null;
	clearTajweedFontCache();
	pendingCheck = null;
	__tajweedFontSupport.set(null);
	return ensureTajweedFontSupport();
}

// Called when the user selects the Tajweed Mushaf font in the settings: runs the check right away instead of waiting for
// the next page render, then (once per browser, in auto mode) points Apple users to the Tajweed compatibility mode setting.
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

	showAlert('Apple devices sometimes have issues with colored fonts. If you see an issue, you can manually change the Tajweed compatibility mode in the settings.', get(__settingsDrawerHidden) ? '' : 'settings-drawer');
}
