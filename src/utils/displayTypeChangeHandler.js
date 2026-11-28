import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { __currentPage, __lastRead } from '$utils/stores';
import { updateSettings } from '$utils/updateSettings';

// Routes a display type change to the mushaf or non-mushaf handler based on the selected display id
export function displayTypeChangeHandler(displayId) {
	const nonMushafModes = [1, 2, 3, 4, 5, 7];
	const mushafMode = [6];

	if (nonMushafModes.includes(displayId)) {
		handleNonMushafMode(displayId);
	} else if (mushafMode.includes(displayId)) {
		handleMushafMode();
	}
}

// Leaves the mushaf page (if on it) by going to the first visible verse, then saves the chosen display type
function handleNonMushafMode(displayId) {
	if (get(__currentPage) === 'mushaf') {
		const firstWordKey = document.querySelector('.word').id;
		const [chapter, verse] = firstWordKey.split(':');
		goto(`/${chapter}/${verse}`);
	}

	updateSettings({ type: 'displayType', value: displayId });
}

// Opens the mushaf page at the user's last read page
function handleMushafMode() {
	const lastReadPage = get(__lastRead).page;
	goto(`/page?id=${lastReadPage}`);
}
