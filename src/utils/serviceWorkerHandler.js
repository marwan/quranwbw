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

export function isUserOnline() {
	return navigator.onLine === true;
}

export function showOfflineAlert() {
	if (isUserOnline()) return;
	showAlert('It looks like you’re offline. Please connect to the internet to use this feature.', 'settings-drawer');
	return false;
}
