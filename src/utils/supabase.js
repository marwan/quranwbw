import { createClient } from '@supabase/supabase-js';
import { updateSettings } from '$utils/updateSettings';
import { __userBookmarks, __userNotes, __settingsConflictOptions } from '$utils/stores';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

// Initialize the auth listener once per session and sync settings if logged in
export async function initSupabaseAuthListener() {
	if (window.__supabaseAuthListenerInitialized) return;
	window.__supabaseAuthListenerInitialized = true;

	// Handle settings on first page load if already signed in
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (session) {
		await handleSettingsSync();
	}

	// Handle settings on future sign-ins
	supabase.auth.onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_IN' && session) {
			await handleSettingsSync();
		}
	});
}

// Sign in the user with Google OAuth and redirect back to the current site
export async function signInWithGoogle() {
	const { error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: window.location.origin
		}
	});

	if (error) console.error('[signInWithGoogle] Login error:', error.message);
}

// Sign out the user and reload the page to clear state
export async function logout() {
	await supabase.auth.signOut();
	location.reload();
}

// Compare Supabase and local settings and either upload or show conflict
export async function handleSettingsSync() {
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.warn('[handleSettingsSync] Not logged in');
		return;
	}

	const { data, error } = await supabase.from('user_settings').select('settings').eq('id', user.id).single();

	// No settings exist in Supabase
	if (error?.code === 'PGRST116' || !data?.settings) {
		const local = localStorage.getItem('userSettings');
		if (local) {
			try {
				const localSettings = JSON.parse(local);
				if (typeof localSettings === 'object') {
					console.log('[handleSettingsSync] No remote settings. Uploading local.');
					await uploadSettingsToCloud(localSettings);
					return;
				}
			} catch {
				console.warn('[handleSettingsSync] Invalid local userSettings');
			}
		}
		return;
	}

	// Compare local and Supabase settings
	const remoteSettings = data.settings;
	const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');

	const remote = {
		userBookmarks: remoteSettings.userBookmarks ?? [],
		userNotes: remoteSettings.userNotes ?? []
	};

	const local = {
		userBookmarks: localSettings.userBookmarks ?? [],
		userNotes: localSettings.userNotes ?? []
	};

	const areEqual = JSON.stringify(remote) === JSON.stringify(local);

	if (!areEqual) {
		console.warn('[handleSettingsSync] Settings conflict detected');
		__settingsConflictOptions.set({
			conflict: true,
			local: localSettings,
			remote: remoteSettings
		});
	} else {
		console.log('[handleSettingsSync] Settings are already in sync');
	}
}

// Apply Supabase settings to localStorage and Svelte stores (user chooses Supabase)
export function useSupabaseSettings() {
	__settingsConflictOptions.update((conflictObj) => {
		if (!conflictObj?.remote) return conflictObj;

		localStorage.setItem('userSettings', JSON.stringify(conflictObj.remote));

		updateSettings({ type: 'userBookmarks', key: conflictObj.remote.userBookmarks, override: true });
		updateSettings({ type: 'userNotes', key: conflictObj.remote.userNotes, override: true });

		__userBookmarks.set(conflictObj.remote.userBookmarks);
		__userNotes.set(conflictObj.remote.userNotes);

		return { conflict: false };
	});
}

// Upload local settings to Supabase (user chooses local version)
export async function useLocalSettings() {
	__settingsConflictOptions.update(async (conflictObj) => {
		if (!conflictObj?.local) return conflictObj;

		await uploadSettingsToCloud(conflictObj.local);
		return { conflict: false };
	});
}

// Upload the given settings object to Supabase for the current user
export async function uploadSettingsToCloud(settings) {
	if (!settings || typeof settings !== 'object') {
		console.warn('[uploadSettingsToCloud] Invalid settings object:', settings);
		return;
	}

	// Get current logged-in user session
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.error('[uploadSettingsToCloud] User not logged in:', userError?.message);
		return;
	}

	const payload = {
		id: user.id,
		settings,
		updated_at: new Date().toISOString()
	};

	console.log('[uploadSettingsToCloud] Uploading:', payload);

	const { error } = await supabase.from('user_settings').upsert(payload);

	if (error) {
		console.error('[uploadSettingsToCloud] Upload failed:', error.message);
	} else {
		console.log('[uploadSettingsToCloud] Upload successful');
	}
}

// Download settings from Supabase for the currently logged-in user
export async function downloadSettingsFromCloud() {
	// Get current logged-in user session
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		console.warn('[downloadSettingsFromCloud] User not logged in or session error:', userError?.message);
		return null;
	}

	// Fetch user settings from the database
	const { data, error } = await supabase.from('user_settings').select('settings').eq('id', user.id).single();

	if (error) {
		if (error.code === 'PGRST116') {
			console.warn('[downloadSettingsFromCloud] No settings found for user in Supabase');
		} else {
			console.warn('[downloadSettingsFromCloud] Error fetching settings:', error.message);
		}
		return null;
	}

	// Return the settings object if found
	if (data?.settings && typeof data.settings === 'object') {
		console.log('[downloadSettingsFromCloud] Settings fetched successfully:', data.settings);
		return data.settings;
	} else {
		console.warn('[downloadSettingsFromCloud] Settings are empty or malformed');
		return null;
	}
}
