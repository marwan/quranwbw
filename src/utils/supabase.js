import { createClient } from '@supabase/supabase-js';
import { updateSettings } from '$utils/updateSettings';
import { __userBookmarks, __userNotes } from '$utils/stores';

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
		provider: 'google',
		options: {
			redirectTo: window.location.origin
		}
	});
	if (error) console.error('Login error:', error.message);
}

// Logout user and refresh the page
export async function logout() {
	await supabase.auth.signOut();
	location.reload();
}

export async function uploadSettingsToCloud(settings) {
	if (!settings || typeof settings !== 'object') {
		console.warn('[uploadSettingsToCloud] Invalid settings object:', settings);
		return;
	}

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('[uploadSettingsToCloud] User not logged in or error fetching user:', userError?.message);
		return;
	}

	const payload = {
		id: user.id,
		settings,
		updated_at: new Date().toISOString()
	};

	console.log('[uploadSettingsToCloud] Uploading settings:', payload);

	const { error } = await supabase.from('user_settings').upsert(payload);

	if (error) {
		console.error('[uploadSettingsToCloud] Failed to upload settings:', error.message);
	} else {
		console.log('[uploadSettingsToCloud] Settings uploaded successfully');
	}
}

export async function downloadSettingsFromCloud() {
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.warn('[downloadSettingsFromCloud] User not logged in or failed to fetch user');
		return null;
	}

	const { data, error } = await supabase.from('user_settings').select('settings').eq('id', user.id).single();

	if (error) {
		if (error.code === 'PGRST116') {
			console.warn('[downloadSettingsFromCloud] No settings row found in Supabase for user');
		} else {
			console.warn('[downloadSettingsFromCloud] Error fetching settings:', error.message);
		}
	} else if (data?.settings && typeof data.settings === 'object') {
		const settings = data.settings;

		console.log('[downloadSettingsFromCloud] Settings fetched from Supabase');

		const userBookmarks = settings.userBookmarks ?? [];
		const userNotes = settings.userNotes ?? [];

		updateSettings({ type: 'userBookmarks', key: userBookmarks, override: true });
		updateSettings({ type: 'userNotes', key: userNotes, override: true });

		__userBookmarks.set(userBookmarks);
		__userNotes.set(userNotes);

		return settings;
	}

	// If no settings found in Supabase, try using localStorage
	const local = localStorage.getItem('userSettings');
	if (local) {
		try {
			const localSettings = JSON.parse(local);
			if (localSettings && typeof localSettings === 'object') {
				console.log('[downloadSettingsFromCloud] No valid settings in Supabase. Uploading from localStorage...');
				await uploadSettingsToCloud(localSettings);
				return localSettings;
			}
		} catch (e) {
			console.warn('[downloadSettingsFromCloud] Invalid JSON in localStorage userSettings');
		}
	}

	return null;
}
