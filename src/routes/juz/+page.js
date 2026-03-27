import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const id = url.searchParams.get('id');

	if (!id) {
		goto('/juz?id=1', { replaceState: false });
	}

	if (id < 1 || id > 30) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { id };
}
