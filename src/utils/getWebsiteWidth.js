import { get } from 'svelte/store';
import { __wideWesbiteLayout } from '$utils/stores';

export function getWebsiteWidth() {
	return get(__wideWesbiteLayout) ? 'max-w-screen-xl' : 'max-w-screen-lg';
}
