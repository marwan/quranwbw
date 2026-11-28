import { get } from 'svelte/store';
import { __wideWebsiteLayoutEnabled } from '$utils/stores';

// Returns the max-width Tailwind class depending on whether the wide website layout is enabled
export function getWebsiteWidth() {
	return get(__wideWebsiteLayoutEnabled) ? 'max-w-screen-xl' : 'max-w-screen-lg';
}
