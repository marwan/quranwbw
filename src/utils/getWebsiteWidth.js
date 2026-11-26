import { get } from 'svelte/store';
import { __wideWebsiteLayoutEnabled } from '$utils/stores';

export function getWebsiteWidth() {
	return get(__wideWebsiteLayoutEnabled) ? 'max-w-screen-xl' : 'max-w-screen-lg';
}
