import { staticEndpoint } from '$data/websiteSettings';

export async function checkAndRegisterServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		console.log('Service Workers are not supported in this browser.');
		return;
	}

	let enabled = null;
	let version = null;

	try {
		// Get current service worker registrations
		const registrations = await navigator.serviceWorker.getRegistrations();
		const swAlreadyRegistered = registrations.length > 0;

		// Add a random query parameter to prevent caching
		const response = await fetch(`${staticEndpoint}/others/service-worker-settings.json?bypass_cache=true&version=${Math.random()}`, { cache: 'no-store' });

		// Ensure a successful response
		if (!response.ok) {
			throw new Error(`API responded with status ${response.status}`);
		}

		({ enabled, version } = await response.json());

		console.log(`Service Worker Settings - Enabled: ${enabled}, Version: ${version}`);

		// If API says disabled and no SW is set, skip further processing
		if (!enabled && !swAlreadyRegistered) {
			console.log('Service Worker is disabled and not registered. Skipping...');
			return;
		}

		if (enabled) {
			if (!swAlreadyRegistered) {
				navigator.serviceWorker
					.register('/service-worker.js')
					.then((registration) => {
						console.log(`Service Worker Registered (Version ${version})`, registration);
					})
					.catch((error) => {
						console.error('Service Worker Registration Failed', error);
					});
			} else {
				console.log('Service Worker is already registered.');
			}
		} else {
			console.log('Unregistering Service Worker and Deleting Cache...');
			await unregisterServiceWorkerAndClearCache(registrations);
		}
	} catch (error) {
		console.error('Failed to fetch service worker settings:', error);
		console.log('Keeping existing service worker state unchanged.');
	}
}

// Function to unregister all service workers and delete caches
async function unregisterServiceWorkerAndClearCache(registrations) {
	try {
		// Unregister all active service workers
		await Promise.all(registrations.map((registration) => registration.unregister()));

		// Delete all caches
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cache) => caches.delete(cache)));

		console.log('All service workers unregistered and caches cleared.');
	} catch (error) {
		console.error('Error while clearing caches:', error);
	}
}
