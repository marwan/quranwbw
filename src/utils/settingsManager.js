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

export function importSettings(file) {
	const reader = new FileReader();

	reader.onload = function (e) {
		try {
			const imported = JSON.parse(e.target.result);

			// Merge with defaults (deep, with type checks)
			const validated = mergeWithDefaults(imported, defaultSettings);

			localStorage.setItem('userSettings', JSON.stringify(validated));
			alert('Settings imported successfully!');
		} catch (err) {
			alert('Invalid settings file.');
			console.error(err);
		}
	};

	reader.readAsText(file);
}

export function exportSettings() {
	const settings = localStorage.getItem('userSettings');
	if (!settings) {
		alert('No settings found.');
		return;
	}

	const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	const filename = `quranwbw-settings-${timestamp}.txt`;

	const blob = new Blob([settings], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	URL.revokeObjectURL(url);
}
