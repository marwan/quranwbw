export const ssr = false;
export const prerender = 'auto';

import { supabase } from '$utils/supabase.js';

export async function load() {
	const {
		data: { session }
	} = await supabase.auth.getSession();

	return { session };
}
