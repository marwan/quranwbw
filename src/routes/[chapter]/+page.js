import { error } from '@sveltejs/kit';
import { goto } from '$app/navigation';
import { isValidVerseKey } from '$utils/validateKey';
import { quranMetaData } from '$data/quranMeta';

export async function load({ params }) {
	// if a colon/dash/period exists and the param is a valid key
	if (params.chapter.includes(':') || params.chapter.includes('-') || params.chapter.includes('.')) {
		let updatedParam;
		updatedParam = params.chapter.replace('-', ':');
		updatedParam = updatedParam.replace('.', ':');
		const chapter = updatedParam.split(':')[0];
		const verse = updatedParam.split(':')[1];

		if (isValidVerseKey(`${chapter}:${verse}`)) {
			goto(`/${chapter}/${verse}`, { replaceState: false });
		}
	}

	// if a chapter slug was provided
	if (getIdByKeyword(params.chapter) !== null) {
		goto(`/${getIdByKeyword(params.chapter)}`, { replaceState: false });
	}

	// basic chapter number check
	if (isNaN(params.chapter) || params.chapter < 1 || params.chapter > 114) {
		error(404, {
			message: 'Not found'
		});
	}

	return { chapter: params.chapter };
}

function getIdByKeyword(keyword) {
	// Basic checks
	if (keyword.length < 3 || typeof keyword !== 'string' || /\d/.test(keyword) || /\s/.test(keyword) || keyword.toLowerCase() === 'the') {
		return null;
	}

	// Remove "the" if it exists at the beginning of the keyword
	if (keyword.toLowerCase().startsWith('the')) {
		keyword = keyword.substring(3);
	}

	keyword = keyword.toLowerCase();
	keyword = keyword.replace(/-/g, '');

	for (let item of quranMetaData) {
		if (item.id > 0) {
			const transliteration = item.transliteration.replace(/[^a-zA-Z]/g, '').toLowerCase();

			// Alternate names check
			if (item.alternateNames !== undefined && item.alternateNames.includes(keyword)) {
				return item.id;
			}

			// Reverse alternate names check
			if (item.alternateNames !== undefined && keyword.includes(item.alternateNames)) {
				return item.id;
			}

			// Other names check
			if (item.arabic.toLowerCase().includes(keyword) || item.translation.toLowerCase().includes(keyword) || transliteration.includes(keyword)) {
				return item.id;
			}

			// Reverse other names check
			if (keyword.includes(item.arabic.toLowerCase()) || keyword.includes(item.translation.toLowerCase()) || keyword.includes(transliteration)) {
				return item.id;
			}
		}
	}
	return null; // Return null if no match is found
}
