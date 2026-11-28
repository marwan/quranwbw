import { deleteDexieDatabase } from '$utils/dexie';
import { unregisterServiceWorkerAndClearCache } from '$utils/offlineModeHandler';

// Wipes all stored settings, caches and local databases, then reloads the page for a clean state
export async function resetSettings() {
	// 1. Remove stored user settings
	localStorage.removeItem('userSettings');

	// 2. Remove analytics opt-out flag
	localStorage.removeItem('disable-rybbit');

	// 3. Unregister service workers and clear caches
	await unregisterServiceWorkerAndClearCache();

	// 4. Delete IndexedDB (Dexie)
	await deleteDexieDatabase();

	// 5. Hard reload to ensure clean state
	location.reload();
}
