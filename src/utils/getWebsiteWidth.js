import { get } from 'svelte/store';
import { __wideWesbiteLayoutEnabled } from '$utils/stores';

export function getWebsiteWidth() {
	return get(__wideWesbiteLayoutEnabled) ? 'max-w-(--breakpoint-xl)' : 'max-w-(--breakpoint-lg)';
}
