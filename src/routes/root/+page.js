import { goto } from '$app/navigation';

export async function load({ url }) {
	const root = url.searchParams.get('root');

	if (!root) {
		goto('/root?root=سمو', { replaceState: false });
	}

	return { root };
}
