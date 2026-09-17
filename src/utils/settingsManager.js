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

	// objects: recurse
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

// Normalize file name → force .json extension
function normalizeFilename(filename) {
	if (!filename.endsWith('.json')) {
		return filename + '.json';
	}
	return filename;
}

// Import settings from a user-selected .json file
export function importSettings(file) {
	// Safeguard: basic checks
	if (!file || !(file instanceof File)) {
		showAlert('Invalid file.', 'settings-drawer');
		return;
	}

	// Only accept .json files
	if (!file.name.endsWith('.json')) {
		showAlert('Invalid file type. Please select a JSON settings file.', 'settings-drawer');
		return;
	}

	window.umami.track('Import Settings');

	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			// Parse the raw file text as JSON
			const imported = JSON.parse(e.target.result);

			// Merge with defaults (deep, with type checks)
			const validated = mergeWithDefaults(imported, defaultSettings);

			// Save merged settings back to localStorage
			localStorage.setItem('userSettings', JSON.stringify(validated));

			// Reload the page to apply settings
			location.reload();
		} catch (error) {
			showAlert(`Something went wrong while importing the file. Here's the error.<pre class="mt-4 p-4 text-xs bg-theme-accent/5 rounded overflow-x-auto"><code>${error.stack || error.message}</code></pre>`, 'settings-drawer');
			console.warn(error);
		}
	};
	reader.readAsText(file);
}

// Export current settings as a downloadable .json file
export function exportSettings() {
	const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

	// Bail out if there's nothing to export
	if (!settings || Object.keys(settings).length === 0) {
		showAlert('No settings found.', 'settings-drawer');
		return;
	}

	try {
		// Build a timestamped filename, e.g. quranwbw-settings-2026-09-17_14-05-32.json
		const now = new Date();
		const pad = (n) => n.toString().padStart(2, '0');
		const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`; // HH-MM-SS

		const rawFilename = `quranwbw-settings-${date}_${time}.json`;
		const filename = normalizeFilename(rawFilename);

		// Build a JSON blob straight from the settings object
		const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		// Trigger the download via a temporary anchor element
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		// Free up the object URL
		URL.revokeObjectURL(url);

		window.umami.track('Export Settings');
	} catch (err) {
		console.error('Failed to export settings:', err);
		showAlert(`Something went wrong while exporting your settings. Here's the error.<pre class="mt-4 p-4 text-xs bg-theme-accent/5 rounded overflow-x-auto"><code>${err.stack || err.message}</code></pre>`, 'settings-drawer');
	}
}
