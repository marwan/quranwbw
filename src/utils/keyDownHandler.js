import { __quranNavigationModalVisible } from '$utils/stores';

// check for key presses
window.addEventListener(
	'keydown',
	(event) => {
		// open Quran nav modal when CTRL+K (Windows/Linux) or CMD+K (macOS) is pressed
		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
			event.preventDefault();
			__quranNavigationModalVisible.set(true);
		}
	},
	true
);
