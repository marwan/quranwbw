import { goto } from '$app/navigation';

export async function load({ params }) {
	const root = params.root;

	goto(`/root?root=${root}`, { replaceState: false });
}
