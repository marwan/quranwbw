import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const juz = url.searchParams.get('id');

	if (!juz) {
		goto('/juz?id=1', { replaceState: false });
	}

	if (juz < 1 || juz > 30 || isNaN(juz)) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { id: juz };
}
