import { get } from 'svelte/store';
import { __websiteTheme } from '$utils/stores';

const themeDirs = {
	1: { dir: 'OT-SVG-L' }, // Golden Glint
	2: { dir: 'OT-SVG-L' }, // Classic Light
	3: { dir: 'OT-SVG-L' }, // Silver Lining
	4: { dir: 'OT-SVG-S' }, // Vintage Sepia
	5: { dir: 'OT-SVG-D' }, // Mocha Night
	6: { dir: 'OT-SVG-D' }, // Midnight Blue
	7: { dir: 'OT-SVG-D' }, // Forest Green
	8: { dir: 'OT-SVG-D' }, // Oled Black
	9: { dir: 'OT-SVG-D' } // Dark Luxury
};

// Return the URL for the mushaf font by page
export function getMushafWordFontLink(page) {
	const newLink = `https://ot-svg-fonts.pages.dev`;

	// Check if `?prototype` is in the URL
	const urlParams = new URLSearchParams(window.location.search);
	const prototypeFolder = urlParams.get('prototype');

	if (prototypeFolder && Number(page) === 1) {
		// Load from prototype folder if param is set and page is 1
		return `${newLink}/prototypes/${prototypeFolder}.woff2?version=1`;
	}

	// Normal logic
	const dir = themeDirs[get(__websiteTheme)].dir;
	return `${newLink}/${dir}/QCF4${`00${Number(page)}`.slice(-3)}_COLOR-Regular.woff2?version=1`;
}
