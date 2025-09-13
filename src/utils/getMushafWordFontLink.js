import { get } from 'svelte/store';
import { mushafWordFontLink, mushafFontVersion } from '$data/websiteSettings';
import { selectableThemes } from '$data/options';
import { __websiteTheme } from '$utils/stores';

// Return the Mushaf font URL for a given page
export function getMushafWordFontLink(page) {
	const paddedPage = String(page).padStart(3, '0'); // ensures 3 digits
	const theme = selectableThemes[get(__websiteTheme)];
	const isDarkFirefox = isFirefox() && theme?.color === 'dark';
	const basePath = isDarkFirefox ? 'COLRv1-Dark-FF' : 'COLRv1';

	return `${mushafWordFontLink}/${basePath}/QCF4${paddedPage}_COLOR-Regular.woff2?version=${mushafFontVersion}`;
}

export function isFirefox() {
	return navigator.userAgent.toLowerCase().includes('firefox');
}
