import { mushafWordFontLink, mushafFontVersion } from '$data/websiteSettings';

// Return the URL for the mushaf font by page
export function getMushafWordFontLink(page) {
	return `${mushafWordFontLink}/QCF4${`00${Number(page)}`.slice(-3)}_COLOR-Regular.woff2?version=${mushafFontVersion}`;
}
