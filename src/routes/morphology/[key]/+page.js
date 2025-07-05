import { error } from '@sveltejs/kit';
import { isValidVerseKey, isValidWordKey } from '$utils/validateKey';

export async function load({ params, url }) {
	// Try to get `key` from query param `word` or from the route param
	const key = url.searchParams.get('word') || params.key;

	if (!key || (!isValidVerseKey(key) && !(await isValidWordKey(key)))) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { key };
}
