import { get } from 'svelte/store';
import { __mushafMinimalModeEnabled, __topNavbarVisible, __bottomToolbarVisible } from '$utils/stores';

// Toggles mushaf minimal mode and updates the top navbar and bottom toolbar visibility stores to match
export function toggleMushafMinimalMode() {
	const isMinimalModeEnabled = get(__mushafMinimalModeEnabled);

	__mushafMinimalModeEnabled.set(!isMinimalModeEnabled);
	__topNavbarVisible.set(!isMinimalModeEnabled);
	__bottomToolbarVisible.set(!isMinimalModeEnabled);
}
