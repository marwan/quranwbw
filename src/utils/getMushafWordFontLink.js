import { get } from 'svelte/store';
import { __websiteTheme } from '$utils/stores';

const themeDirs = {
	1: { dir: 'OT-SVG-L' },
	2: { dir: 'OT-SVG-L' },
	3: { dir: 'OT-SVG-L' },
	4: { dir: 'OT-SVG-S' },
	5: { dir: 'OT-SVG-D' },
	6: { dir: 'OT-SVG-D' },
	7: { dir: 'OT-SVG-D' },
	8: { dir: 'OT-SVG-D' },
	9: { dir: 'OT-SVG-D' }
};

// Return the URL for the mushaf font by page
export function getMushafWordFontLink(page) {
	const newLink = `https://ot-svg-fonts.pages.dev`;
	const dir = themeDirs[get(__websiteTheme)].dir;
	return `${newLink}/${dir}/QCF4${`00${Number(page)}`.slice(-3)}_COLOR-Regular.woff2?version=1`;
}
