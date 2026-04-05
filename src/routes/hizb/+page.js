import { goto } from '$app/navigation';

export async function load() {
	goto('/hizb/1', { replaceState: false });
}
