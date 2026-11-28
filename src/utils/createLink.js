import { linkClasses } from '$data/commonClasses';

// Returns an anchor tag string that opens in a new tab, with optional custom classes and extra attributes
export function createLink(href, title, classes = linkClasses, attributes = '') {
	return `<a href="${href}" target="_blank" class="${classes}" ${attributes}>${title}</a>`;
}
