import { defaultSettings } from '$src/hooks.client';

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

// Encode JSON: stringify → reverse → Base64
function encodeSettings(json) {
	const str = JSON.stringify(json);
	return btoa(str.split('').reverse().join(''));
}

// Decode JSON: Base64 → reverse → parse
function decodeSettings(encoded) {
	try {
		const reversed = atob(encoded).split('').reverse().join('');
		return JSON.parse(reversed);
	} catch (error) {
		console.error(error);
		throw new Error('Invalid settings file');
	}
}

// Normalize file name → force .qwbw extension
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
	if (!file || !(file instanceof File)) {
		alert('Invalid file.');
		return;
	}
	if (!file.name.endsWith('.qwbw') && !file.name.endsWith('.qwbw.txt')) {
		alert('Invalid file type. Please select a QuranWBW settings file.');
		return;
	}

	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			// Ask before proceeding
			const proceed = confirm('Are you sure you want to import settings? This will overwrite your current preferences.');
			if (!proceed) return;

			const imported = decodeSettings(e.target.result);

			// Merge with defaults (deep, with type checks)
			const validated = mergeWithDefaults(imported, defaultSettings);

			localStorage.setItem('userSettings', JSON.stringify(validated));
			alert('Settings imported successfully. The page will now reload.');

			// Reload the page to apply settings
			location.reload();
		} catch (error) {
			alert('Something went wrong while importing the file.');
			console.error(error);
		}
	};
	reader.readAsText(file);
}

export function exportSettings() {
	const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
	if (!settings || Object.keys(settings).length === 0) {
		alert('No settings found.');
		return;
	}

	const encoded = encodeSettings(settings);

	const now = new Date();
	const pad = (n) => n.toString().padStart(2, '0');
	const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
	const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`; // HH-MM-SS

	const rawFilename = `quranwbw-settings-${date}_${time}.qwbw`;
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
}
