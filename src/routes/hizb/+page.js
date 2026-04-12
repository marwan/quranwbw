import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const hizb = url.searchParams.get('id');

	if (!hizb) {
		goto('/hizb?id=1', { replaceState: false });
	}

	if (hizb < 1 || hizb > 60 || isNaN(hizb)) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { id: hizb };
}
