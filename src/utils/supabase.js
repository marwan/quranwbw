import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function uploadSettingsToCloud(settings) {
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('User not logged in or error fetching user:', userError?.message);
		return;
	}

	const { error } = await supabase.from('user_settings').upsert({
		id: user.id,
		settings,
		updated_at: new Date().toISOString()
	});

	if (error) {
		console.error('Failed to upload settings to Supabase:', error.message);
	} else {
		console.log('Settings uploaded to Supabase');
	}
}

export async function downloadSettingsFromCloud() {
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.warn('User not logged in or failed to fetch user');
		return null;
	}

	const { data, error } = await supabase.from('user_settings').select('settings').eq('id', user.id).single();

	if (error) {
		console.warn('Could not fetch user settings:', error.message);
		return null;
	}

	if (data?.settings) {
		console.log('Settings fetched from Supabase');
		return data.settings;
	}

	return null;
}
