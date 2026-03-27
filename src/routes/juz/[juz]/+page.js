import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const juz = params.juz;

	if (juz < 1 || juz > 30) {
		throw error(404, {
			message: 'Not found'
		});
	}

	goto(`/juz?id=${juz}`, { replaceState: false });
}
