import { deleteDexieDatabase } from '$utils/dexie';
import { unregisterServiceWorkerAndClearCache } from '$utils/serviceWorkerHandler';

export async function resetSettings() {
	// 1. Remove stored user settings
	localStorage.removeItem('userSettings');

	// 2. Unregister service workers and clear caches
	await unregisterServiceWorkerAndClearCache();

	// 3. Delete IndexedDB (Dexie)
	await deleteDexieDatabase();

	// 4. Hard reload to ensure clean state
	location.reload();
}
