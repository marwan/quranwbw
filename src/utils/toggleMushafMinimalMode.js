import { get } from 'svelte/store';
import { __mushafMinimalModeEnabled, __topNavbarVisible, __bottomToolbarVisible } from '$utils/stores';

export function toggleMushafMinimalMode() {
	const isMinimalModeEnabled = get(__mushafMinimalModeEnabled);

	__mushafMinimalModeEnabled.set(!isMinimalModeEnabled);
	__topNavbarVisible.set(!isMinimalModeEnabled);
	__bottomToolbarVisible.set(!isMinimalModeEnabled);
}
