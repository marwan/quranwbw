import { build, files, version } from '$service-worker';

/**
 * SERVICE WORKER FOR QURANWBW OFFLINE FUNCTIONALITY
 *
 * This service worker enables optional offline access to the website.
 * It does NOT automatically cache anything - users must explicitly enable offline mode.
 *
 * HOW IT WORKS:
 * 1. Service worker registers automatically when user visits the site (but does nothing)
 * 2. User initially downloads the core website files
 * 3. Service worker receives START_CACHING message
 * 4. All website pages are downloaded and cached on the user's device
 * 5. When offline, cached pages are served instead of showing errors
 *
 * UPDATES:
 * When we deploy a new version:
 * - Users with offline mode enabled will automatically get the updated cache
 * - Old cached data is deleted and replaced with new data
 * - Users without offline mode enabled see no difference
 */

// Create a unique cache name for this deployment
// The version changes each time we deploy, so old caches can be identified and deleted
const cacheName = `quranwbw-cache-${version}`;

// Separate cache for storing user preferences (survives across versions)
const configCacheName = 'quranwbw-config';

// Files we should never cache (the service worker itself and its settings)
const stuffNotToCache = ['/service-worker.js', '/service-worker-settings.json'];

// Static files built by SvelteKit (CSS, JS, images from /static folder)
const precacheFiles = [
	...files, // Static files from /static folder
	...build // Generated JS/CSS chunks (includes the main bundle)
];

// Important pages we want to cache
const staticRoutesToCache = ['/about', '/bookmarks', '/changelog', '/duas', '/games/guess-the-word', '/morphology', '/offline', '/supplications'];

// This flag tracks whether the user has enabled offline mode
// Starts as false - user must explicitly enable it
let cachingEnabled = false;

/**
 * CHECK IF USER PREVIOUSLY ENABLED OFFLINE MODE
 * Reads from the config cache to see if caching was enabled before
 */
async function getCachingStatus() {
	try {
		const cache = await caches.open(configCacheName);
		const response = await cache.match('caching-enabled');
		if (response) {
			const data = await response.json();
			return data.enabled;
		}
	} catch (error) {
		console.warn('Could not read caching status:', error);
	}
	return false;
}

/**
 * SAVE USER'S OFFLINE MODE PREFERENCE
 * Stores whether caching is enabled so it persists across updates
 */
async function saveCachingStatus(enabled) {
	try {
		const cache = await caches.open(configCacheName);
		await cache.put(
			'caching-enabled',
			new Response(JSON.stringify({ enabled }), {
				headers: { 'Content-Type': 'application/json' }
			})
		);
	} catch (error) {
		console.warn('Could not save caching status:', error);
	}
}

/**
 * INSTALL EVENT
 * Runs when service worker is first installed
 * We skip waiting so the new service worker activates immediately
 */
self.addEventListener('install', () => {
	self.skipWaiting();
});

/**
 * ACTIVATE EVENT
 * Runs when service worker becomes active (takes control of the page)
 *
 * This is where we:
 * 1. Check if user had offline mode enabled before
 * 2. If yes, automatically update their cache with new content
 * 3. Delete old caches from previous versions ONLY AFTER new cache is complete
 */
self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Check if user previously enabled offline mode
			cachingEnabled = await getCachingStatus();

			// If they did, automatically recache everything with the new version
			if (cachingEnabled) {
				console.log('Caching was previously enabled, updating cache...');

				// Tell the website that we're updating the cache
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'CACHE_UPDATE_STARTED' });
				});

				// Download and cache all content (WAIT for this to complete)
				await performCaching();

				// Tell the website we're done updating
				const finalClients = await self.clients.matchAll();
				finalClients.forEach((client) => {
					client.postMessage({ type: 'CACHE_UPDATE_COMPLETE' });
				});

				// NOW delete old caches (only after new cache is complete)
				const keys = await caches.keys();
				await Promise.all(
					keys.map((key) => {
						if (key !== cacheName && key !== configCacheName) {
							console.log('Deleting old cache:', key);
							return caches.delete(key);
						}
					})
				);
			} else {
				// If caching was not enabled, just delete old caches immediately
				const keys = await caches.keys();
				await Promise.all(
					keys.map((key) => {
						if (key !== cacheName && key !== configCacheName) {
							console.log('Deleting old cache:', key);
							return caches.delete(key);
						}
					})
				);
			}

			// Take control of all pages immediately
			await self.clients.claim();
		})()
	);
});

/**
 * PERFORM CACHING
 * Downloads and caches all website content
 * This function is called both when user enables offline mode
 * and when service worker updates automatically
 */
async function performCaching() {
	const cache = await caches.open(cacheName);

	// Cache the homepage and all build files (CSS, JS, etc.)
	await cache.addAll(['/', ...precacheFiles]);

	// Helper function to cache a list of routes with progress tracking
	const backgroundCache = async (routes, label) => {
		const total = routes.length;
		for (let i = 0; i < routes.length; i++) {
			try {
				// Fetch the page
				const response = await fetch(routes[i]);
				if (response.ok) {
					// Save it to cache
					await cache.put(routes[i], response.clone());
				}
			} catch (error) {
				console.warn('Install cache failed for:', routes[i], error);
			}

			// Send progress update to the website (so we can show a progress bar)
			const progressClients = await self.clients.matchAll();
			progressClients.forEach((client) => {
				client.postMessage({
					type: 'CACHE_PROGRESS',
					category: label,
					current: i + 1,
					total: total
				});
			});
		}
	};

	// Cache all the different types of pages
	await backgroundCache(staticRoutesToCache, 'static-routes');
}

/**
 * MESSAGE EVENT
 * Listens for messages from the website
 *
 * START_CACHING: User initially downloads the core website files
 * DISABLE_CACHING: User wants to clear all offline data
 */
self.addEventListener('message', (event) => {
	// User wants to enable offline mode
	if (event.data.type === 'START_CACHING') {
		cachingEnabled = true;
		saveCachingStatus(true); // Remember this preference

		event.waitUntil(
			(async () => {
				// Tell the website we're starting
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'CACHE_STARTED' });
				});

				// Download and cache everything
				await performCaching();

				// Tell the website we're done
				const finalClients = await self.clients.matchAll();
				finalClients.forEach((client) => {
					client.postMessage({
						type: 'CACHE_COMPLETE',
						cacheName: cacheName
					});
				});
			})()
		);
	}
	// User wants to disable offline mode and clear all data
	else if (event.data.type === 'DISABLE_CACHING') {
		cachingEnabled = false;
		saveCachingStatus(false); // Remember this preference

		event.waitUntil(
			(async () => {
				// Delete all caches
				const keys = await caches.keys();
				await Promise.all(keys.map((key) => caches.delete(key)));

				// Tell the website cache is cleared
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'CACHE_CLEARED' });
				});
			})()
		);
	}
});

/**
 * FETCH EVENT
 * Intercepts all network requests from the website
 *
 * If offline mode is enabled:
 * - Try to serve from cache first
 * - If not in cache, fetch from network and cache it
 * - If offline and not in cache, show error (or homepage for navigation)
 *
 * If offline mode is disabled:
 * - Just fetch from network normally (service worker does nothing)
 */
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Ignore non-GET requests (POST, PUT, etc.) and excluded files
	if (event.request.method !== 'GET' || stuffNotToCache.some((excluded) => url.pathname.includes(excluded))) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// If we have it in cache AND caching is enabled, return cached version
			if (cachedResponse && cachingEnabled) {
				return cachedResponse;
			}

			// Otherwise, fetch from network
			return fetch(event.request)
				.then((networkResponse) => {
					// If request failed, just return the error
					if (!networkResponse || networkResponse.status !== 200) {
						return networkResponse;
					}

					// If caching is enabled, save this response for next time
					if (cachingEnabled) {
						return caches.open(cacheName).then((cache) => {
							cache.put(event.request, networkResponse.clone());
							return networkResponse;
						});
					}

					return networkResponse;
				})
				.catch(() => {
					// Network request failed (user is offline)

					// For page navigation, show the homepage if cached
					if (event.request.mode === 'navigate' && cachingEnabled) {
						return caches.match('/');
					}

					// For other resources (images, CSS, etc.), return error
					return new Response('Offline - resource not cached', {
						status: 503,
						statusText: 'Service Unavailable',
						headers: new Headers({
							'Content-Type': 'text/plain'
						})
					});
				});
		})
	);
});
