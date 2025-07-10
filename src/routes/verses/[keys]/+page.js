import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';
import { isValidVerseKey } from '$utils/validateKey';

export async function load({ params }) {
	const raw = params.keys;

	if (!raw) {
		throw error(404, { message: 'No keys provided' });
	}

	const allKeys = raw.split(',').map((k) => k.trim());
	const validKeys = allKeys.filter(isValidVerseKey);

	if (validKeys.length === 0) {
		throw error(404, { message: 'No valid keys found' });
	}

	goto(`/verses?keys=${validKeys.join(',')}`, { replaceState: false });
}
