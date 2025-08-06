import { get } from 'svelte/store';
import { __wideWesbiteLayoutEnabled } from '$utils/stores';

export function getWebsiteWidth() {
	return get(__wideWesbiteLayoutEnabled) ? 'max-w-screen-xl' : 'max-w-screen-lg';
}
