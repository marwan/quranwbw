import { goto } from '$app/navigation';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const hizb = params.hizb;

	if (hizb < 1 || hizb > 60 || isNaN(hizb)) {
		throw error(404, {
			message: 'Not found'
		});
	}

	goto(`/hizb?id=${hizb}`, { replaceState: false });
}
