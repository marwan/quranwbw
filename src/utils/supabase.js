import { createClient } from '@supabase/supabase-js';
import { updateSettings } from '$utils/updateSettings';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function initSupabaseAuthListener() {
	if (window.__supabaseAuthListenerInitialized) return;
	window.__supabaseAuthListenerInitialized = true;

	// Run once on fresh page load (if already logged in)
	const {
		data: { session }
	} = await supabase.auth.getSession();
	if (session) {
		await downloadSettingsFromCloud();
	}

	// Also run on any new login via Google OAuth
	supabase.auth.onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_IN' && session) {
			await downloadSettingsFromCloud();
		}
	});
}

// Initiate Google OAuth login with Supabase
export async function loginWithGoogle() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: 'google'
	});
	if (error) console.error('Login error:', error.message);
}

// Logout user and refresh the page
export async function logout() {
	await supabase.auth.signOut();
	location.reload();
}

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

		const userSettings = data.settings;

		console.log(userSettings);

		const userBookmarks = userSettings.userBookmarks;
		const userNotes = userSettings.userNotes;

		// Restore data
		updateSettings({ type: 'userBookmarks', key: userBookmarks, override: true });
		updateSettings({ type: 'userNotes', key: userNotes, override: true });
	}

	return null;
}
