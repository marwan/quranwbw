import { defaultSettings } from '$src/hooks.client';
import { showAlert } from '$utils/confirmationAlertHandler';

// Deep-merge imported settings with defaults, enforcing type safety
function mergeWithDefaults(imported, defaults) {
	// If default is a primitive, accept imported only if type matches
	if (typeof defaults !== 'object' || defaults === null) {
		return typeof imported === typeof defaults ? imported : defaults;
	}

	// If default is an array, accept imported only if it’s also an array
	if (Array.isArray(defaults)) {
		return Array.isArray(imported) ? imported : defaults;
	}

	// For objects, recursively merge each key
	const result = {};
	for (const key in defaults) {
		if (key in imported) {
			result[key] = mergeWithDefaults(imported[key], defaults[key]);
		} else {
			result[key] = defaults[key]; // fallback to default if missing
		}
	}
	return result;
}

// Encode settings: JSON stringify → reverse string → Base64
function encodeSettings(json) {
	const str = JSON.stringify(json);
	return btoa(str.split('').reverse().join(''));
}

// Decode settings: Base64 → reverse string → JSON parse
function decodeSettings(encoded) {
	try {
		const reversed = atob(encoded).split('').reverse().join('');
		return JSON.parse(reversed);
	} catch (error) {
		console.warn(error);
		throw new Error('Invalid settings file');
	}
}

// Ensure exported filename always ends with .qwbw
function normalizeFilename(filename) {
	if (filename.endsWith('.qwbw.txt')) {
		return filename.replace(/\.qwbw\.txt$/, '.qwbw');
	}
	if (!filename.endsWith('.qwbw')) {
		return filename + '.qwbw';
	}
	return filename;
}

// Import settings from a validated .qwbw file
export function importSettings(file) {
	// Validate file object
	if (!file || !(file instanceof File)) {
		showAlert('Invalid file.', 'settings-drawer');
		return;
	}

	// Validate file extension
	if (!file.name.endsWith('.qwbw') && !file.name.endsWith('.qwbw.txt')) {
		showAlert('Invalid file type. Please select a QuranWBW settings file.', 'settings-drawer');
		return;
	}

	// Track import event
	window.umami.track('Import Settings');

	const reader = new FileReader();

	// Handle file load
	reader.onload = function (e) {
		try {
			// Decode and parse imported settings
			const imported = decodeSettings(e.target.result);

			// Merge imported settings with defaults safely
			const validated = mergeWithDefaults(imported, defaultSettings);

			// Persist validated settings
			localStorage.setItem('userSettings', JSON.stringify(validated));

			// Reload to apply changes
			location.reload();
		} catch (error) {
			showAlert('Something went wrong while importing the file.', 'settings-drawer');
			console.warn(error);
		}
	};

	// Read file as plain text
	reader.readAsText(file);
}

// Export current settings to a downloadable .qwbw file
export function exportSettings() {
	// Load settings from localStorage
	const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

	// Abort if no settings exist
	if (!settings || Object.keys(settings).length === 0) {
		showAlert('No settings found.', 'settings-drawer');
		return;
	}

	// Encode settings for export
	const encoded = encodeSettings(settings);

	// Generate timestamped filename
	const now = new Date();
	const pad = (n) => n.toString().padStart(2, '0');
	const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
	const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`; // HH-MM-SS

	const rawFilename = `quranwbw-settings-${date}_${time}.qwbw`;
	const filename = normalizeFilename(rawFilename);

	// Create downloadable file
	const blob = new Blob([encoded], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);

	// Trigger browser download
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	// Cleanup object URL
	URL.revokeObjectURL(url);

	// Track export event
	window.umami.track('Export Settings');
}
