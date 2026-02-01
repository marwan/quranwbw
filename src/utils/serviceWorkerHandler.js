import { showAlert } from '$utils/confirmationAlertHandler';

export async function registerServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		return { success: false, error: 'Not supported' };
	}

	try {
		// Get or register the service worker
		let registration = await navigator.serviceWorker.getRegistration();

		if (!registration) {
			registration = await navigator.serviceWorker.register('/service-worker.js', {
				type: 'module'
			});
		}

		// Wait for it to be ready
		await navigator.serviceWorker.ready;

		// Listen for messages from service worker
		navigator.serviceWorker.addEventListener('message', (event) => {
			if (event.data.type === 'CACHE_STARTED') {
				window.dispatchEvent(
					new CustomEvent('sw-cache-started', {
						detail: event.data
					})
				);
			} else if (event.data.type === 'CACHE_PROGRESS') {
				window.dispatchEvent(
					new CustomEvent('sw-cache-progress', {
						detail: event.data
					})
				);
			} else if (event.data.type === 'CACHE_COMPLETE') {
				window.dispatchEvent(
					new CustomEvent('sw-cache-complete', {
						detail: event.data
					})
				);
			}
		});

		// Tell the service worker to start caching
		navigator.serviceWorker.controller?.postMessage({ type: 'START_CACHING' });

		return { success: true, registration };
	} catch (error) {
		console.warn('SW registration failed:', error);
		return { success: false, error: error.message };
	}
}

// Function to unregister all service workers and delete caches
export async function unregisterServiceWorkerAndClearCache() {
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();

		// Unregister all active service workers
		await Promise.all(registrations.map((registration) => registration.unregister()));

		// Delete all caches
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cache) => caches.delete(cache)));

		console.log('All service workers unregistered and caches cleared.');
	} catch (error) {
		console.warn('Error while clearing caches:', error);
	}
}

// Returns true if the user has actual internet connectivity.
// Uses `navigator.onLine` plus a small uncached network ping to avoid false positives.
export async function isUserOnline(timeout = 500) {
	// Quick fail: browser explicitly says offline
	// if (!navigator.onLine) return false;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	try {
		// Use a lightweight, no-cors, cache-busted request
		const response = await fetch('https://www.gstatic.com/generate_204?cacheBust=' + Date.now(), {
			method: 'GET',
			mode: 'no-cors',
			cache: 'no-store',
			signal: controller.signal
		});

		clearTimeout(id);

		// Check if response is actually successful
		// Note: no-cors mode always returns opaque responses (status 0)
		// so we check for either 0 (opaque success) or 200-299 range
		return response.type === 'opaque' || (response.status >= 200 && response.status < 300);
	} catch (error) {
		clearTimeout(id);
		console.warn('Network check failed:', error);
		return false;
	}
}

export function showOfflineAlert() {
	showAlert('It looks like you’re offline. Please connect to the internet to use this feature.', 'settings-drawer');
	return false;
}

// Checks internet connectivity and shows the offline alert if unavailable.
// Returns true if online, false if offline.
export async function checkOnlineAndAlert() {
	const online = await isUserOnline();
	if (online) return true;

	showOfflineAlert();
	return false;
}
