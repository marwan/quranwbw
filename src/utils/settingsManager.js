import { defaultSettings } from '$src/hooks.client';
import { showAlert } from '$utils/confirmationAlertHandler';

// Helper: deep merge imported settings with defaults and type check
function mergeWithDefaults(imported, defaults) {
	if (typeof defaults !== 'object' || defaults === null) {
		// primitive
		return typeof imported === typeof defaults ? imported : defaults;
	}

	if (Array.isArray(defaults)) {
		// arrays: accept only if array
		return Array.isArray(imported) ? imported : defaults;
	}

	// objects with no fixed shape (e.g. dynamic maps like userNotes) -> pass through imported as-is
	if (Object.keys(defaults).length === 0) {
		return typeof imported === 'object' && imported !== null && !Array.isArray(imported) ? imported : defaults;
	}

	// objects with a fixed shape: recurse per key
	const result = {};
	for (const key in defaults) {
		if (key in imported) {
			result[key] = mergeWithDefaults(imported[key], defaults[key]);
		} else {
			result[key] = defaults[key];
		}
	}
	return result;
}

// Encode JSON: stringify → reverse → UTF-8 bytes → Base64
function encodeSettings(json) {
	const str = JSON.stringify(json);
	const reversed = str.split('').reverse().join('');
	const bytes = new TextEncoder().encode(reversed);
	// convert byte array to a Latin1-safe binary string for btoa
	const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
	return btoa(binary);
}

// Decode JSON: Base64 → UTF-8 bytes → reverse → parse
// This is the real gatekeeper now that we no longer trust file extensions:
// any file that doesn't decode into valid JSON is rejected here.
function decodeSettings(encoded) {
	try {
		const binary = atob(encoded.trim());
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		const reversed = new TextDecoder().decode(bytes);
		const str = reversed.split('').reverse().join('');
		const parsed = JSON.parse(str);

		// enforce that decoded content is a plain object (not an array, string, number, etc.)
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error('Decoded content is not a valid settings object');
		}

		return parsed;
	} catch (error) {
		console.warn(error);
		throw new Error('Invalid settings file');
	}
}

// Normalize file name → force .qwbw extension (used for exports only)
function normalizeFilename(filename) {
	if (filename.endsWith('.qwbw.txt')) {
		return filename.replace(/\.qwbw\.txt$/, '.qwbw');
	}
	if (!filename.endsWith('.qwbw')) {
		return filename + '.qwbw';
	}
	return filename;
}

export function importSettings(file) {
	// Safeguard: basic checks
	// NOTE: no longer checking file.name / extension here — iOS share sheet can
	// save the exported .qwbw file as .txt (or with no extension at all).
	// Validity is instead fully determined by decodeSettings() below
	// (valid Base64 -> valid UTF-8 -> valid JSON -> plain object).
	if (!file || !(file instanceof File)) {
		showAlert('Invalid file.', 'settings-drawer');
		return;
	}

	window.umami.track('Import Settings');

	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const imported = decodeSettings(e.target.result);

			// Merge with defaults (deep, with type checks)
			const validated = mergeWithDefaults(imported, defaultSettings);

			localStorage.setItem('userSettings', JSON.stringify(validated));

			// Reload the page to apply settings
			location.reload();
		} catch (error) {
			showAlert('Something went wrong while importing the file.', 'settings-drawer');
			console.warn(error);
		}
	};
	reader.readAsText(file);
}

export function exportSettings() {
	const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
	if (!settings || Object.keys(settings).length === 0) {
		showAlert('No settings found.', 'settings-drawer');
		return;
	}

	try {
		const encoded = encodeSettings(settings);

		const now = new Date();
		const pad = (n) => n.toString().padStart(2, '0');
		const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`; // HH-MM-SS

		const rawFilename = `quranwbw-settings-${date}_${time}.qwbw`;
		// still name it .qwbw on our end — iOS may rename it to .txt on save,
		// but that's fine now since import no longer cares about the extension
		const filename = normalizeFilename(rawFilename);

		const blob = new Blob([encoded], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);

		window.umami.track('Export Settings');
	} catch (err) {
		console.error('Failed to export settings:', err);
		showAlert(`Something went wrong while exporting your settings. Here's the error.<pre class="mt-4 p-4 text-xs bg-theme-accent/5 rounded overflow-x-auto"><code>${err.stack || err.message}</code></pre>`, 'settings-drawer');
	}
}
