import { get } from 'svelte/store';
import { createClient } from '@supabase/supabase-js';
import { updateSettings } from '$utils/updateSettings';
import { __userBookmarks, __userNotes, __settingsConflictOptions } from '$utils/stores';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true
	}
});

// Initialize the auth listener once per session and sync settings if logged in
export function initSupabaseAuthListener() {
	console.log('[initSupabaseAuthListener] Setting up listener...');

	supabase.auth.onAuthStateChange((event, session) => {
		console.log('[Auth] Event:', event, session);

		switch (event) {
			case 'SIGNED_IN':
				console.log('[Auth] User signed in');
				break;

			case 'SIGNED_OUT':
				console.log('[Auth] User signed out');
				break;

			case 'TOKEN_REFRESHED':
				console.log('[Auth] Token refreshed successfully');
				break;

			case 'TOKEN_REFRESH_FAILED':
				console.error('[Auth] Token refresh failed — forcing sign out to recover');
				supabase.auth.signOut(); // prevents client from hanging forever
				break;

			case 'USER_UPDATED':
				console.log('[Auth] User updated');
				break;

			default:
				console.log('[Auth] Other event:', event);
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
	const conflictObj = get(__settingsConflictOptions);
	if (!conflictObj?.local) return;

	await uploadSettingsToCloud(conflictObj.local);
	__settingsConflictOptions.set({ conflict: false });
}

// Upload the given settings object to Supabase for the current user
export async function uploadSettingsToCloud(settings) {
	console.log('[uploadSettingsToCloud] Called');

	try {
		if (!settings || typeof settings !== 'object') {
			console.warn('[uploadSettingsToCloud] Invalid settings object:', settings);
			return;
		}

		console.log('[uploadSettingsToCloud] Calling getSession…');

		// Add a timeout so we know if getSession() hangs
		const promise = supabase.auth.getSession();
		const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout after 5s')), 5000));

		const { data: sessionData, error: sessionError } = await Promise.race([promise, timeout]);

		console.log('[uploadSettingsToCloud] getSession result:', { sessionData, sessionError });

		if (sessionError || !sessionData?.session?.user) {
			console.error('[uploadSettingsToCloud] No active session/user:', sessionError?.message);
			return;
		}

		const user = sessionData.session.user;

		const payload = {
			id: user.id,
			settings,
			updated_at: new Date().toISOString()
		};

		console.log('[uploadSettingsToCloud] Uploading payload:', payload);

		// Upsert with onConflict to ensure it always updates the same row
		const { data, error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'id' }).select();

		if (error) {
			console.error('[uploadSettingsToCloud] Upload failed:', error.message);
		} else {
			console.log('[uploadSettingsToCloud] Upload successful:', data);
		}
	} catch (err) {
		console.error('[uploadSettingsToCloud] Unexpected error:', err);
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
