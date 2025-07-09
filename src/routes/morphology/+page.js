import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';
import { isValidVerseKey, isValidWordKey } from '$utils/validateKey';

export async function load({ url }) {
	const key = url.searchParams.get('word');

	if (!key) {
		goto('/morphology?word=1:1:1', { replaceState: false });
	}

	if (!isValidVerseKey(key) && !(await isValidWordKey(key))) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { key };
}
