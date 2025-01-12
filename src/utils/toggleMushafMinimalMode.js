import { get } from 'svelte/store';
import { __mushafMinimalModeEnabled, __topNavbarVisible, __bottomToolbarVisible } from '$utils/stores';
import { trackElementClick } from '$utils/trackElementClick';

export function toggleMushafMinimalMode() {
	const isMinimalModeEnabled = get(__mushafMinimalModeEnabled);

	__mushafMinimalModeEnabled.set(!isMinimalModeEnabled);
	__topNavbarVisible.set(!isMinimalModeEnabled);
	__bottomToolbarVisible.set(!isMinimalModeEnabled);

	trackElementClick('mushaf-minimal-btn');
}
