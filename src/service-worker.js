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

// Different cache names for different data types
const cacheNames = {
	core: `quranwbw-cache-${version}`, // Core website files (versioned)
	config: 'quranwbw-config', // User preferences (survives across versions)
	chapterData: 'quranwbw-chapter-data', // Chapter routes and data
	juzData: 'quranwbw-juz-data', // Juz routes and data
	mushafData: 'quranwbw-mushaf-data', // Mushaf pages and fonts
	morphologyData: 'quranwbw-morphology-data', // Morphology data files
	tafsirData: 'quranwbw-tafsir-data' // Tafsir data files
};

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
// CRITICAL: This must be loaded from cache on startup!
let cachingEnabled = false;
let cachingStatusLoaded = false; // Track if we've loaded the status

/**
 * CHECK IF USER PREVIOUSLY ENABLED OFFLINE MODE
 * Reads from the config cache to see if caching was enabled before
 */
async function getCachingStatus() {
	try {
		const cache = await caches.open(cacheNames.config);
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
		const cache = await caches.open(cacheNames.config);
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
 * ENSURE CACHING STATUS IS LOADED
 * This must be called before any fetch events use cachingEnabled
 */
async function ensureCachingStatusLoaded() {
	if (!cachingStatusLoaded) {
		cachingEnabled = await getCachingStatus();
		cachingStatusLoaded = true;
		console.log('[SW] Caching status loaded:', cachingEnabled);
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
			// CRITICAL: Load caching status immediately
			await ensureCachingStatusLoaded();

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
						// Delete any cache that starts with 'quranwbw-cache-' but is not the current version
						if (key.startsWith('quranwbw-cache-') && key !== cacheNames.core) {
							console.log('[SW] Deleting old versioned cache:', key);
							return caches.delete(key);
						}
					})
				);
			} else {
				// If caching was not enabled, just delete old caches immediately
				const keys = await caches.keys();
				await Promise.all(
					keys.map((key) => {
						// Delete any cache that starts with 'quranwbw-cache-' but is not the current version
						if (key.startsWith('quranwbw-cache-') && key !== cacheNames.core) {
							console.log('[SW] Deleting old versioned cache:', key);
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
	const cache = await caches.open(cacheNames.core);

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
 * CACHE_URL: Cache a specific URL to a specific cache
 * DELETE_CACHE: Delete a specific cache
 * DISABLE_CACHING: User wants to clear all offline data
 */
self.addEventListener('message', (event) => {
	// User wants to enable offline mode
	if (event.data.type === 'START_CACHING') {
		cachingEnabled = true;
		cachingStatusLoaded = true;
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
						cacheName: cacheNames.core
					});
				});
			})()
		);
	}
	// Cache a specific URL to a specific cache
	else if (event.data.type === 'CACHE_URL') {
		event.waitUntil(
			(async () => {
				try {
					const cacheName = event.data.cacheName || cacheNames.core;
					const cache = await caches.open(cacheName);
					const response = await fetch(event.data.url);
					if (response.ok) {
						await cache.put(event.data.url, response);
					}
				} catch (error) {
					console.warn('Failed to cache URL:', event.data.url, error);
				}
			})()
		);
	}
	// Delete a specific cache
	else if (event.data.type === 'DELETE_CACHE') {
		event.waitUntil(
			(async () => {
				try {
					const cacheName = event.data.cacheName;
					await caches.delete(cacheName);

					const clients = await self.clients.matchAll();
					clients.forEach((client) => {
						client.postMessage({
							type: 'CACHE_DELETED',
							cacheName: cacheName
						});
					});
				} catch (error) {
					console.warn('Failed to delete cache:', event.data.cacheName, error);
				}
			})()
		);
	}
	// User wants to disable offline mode and clear all data
	else if (event.data.type === 'DISABLE_CACHING') {
		cachingEnabled = false;
		cachingStatusLoaded = true;
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
 * - Try to serve from cache first (checks all caches)
 * - If not in cache, fetch from network and cache it
 * - If offline and not in cache, show error (or homepage for navigation)
 *
 * If offline mode is disabled:
 * - Just fetch from network normally (service worker does nothing)
 */
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Ignore non-GET requests, excluded files, and connectivity checks
	if (event.request.method !== 'GET' || stuffNotToCache.some((excluded) => url.pathname.includes(excluded)) || url.hostname === 'www.gstatic.com') {
		return;
	}

	event.respondWith(
		(async () => {
			// CRITICAL: Ensure caching status is loaded before checking it
			await ensureCachingStatusLoaded();

			// If caching is enabled, try all caches first
			if (cachingEnabled) {
				const allCacheNames = Object.values(cacheNames);
				for (const cacheName of allCacheNames) {
					const cache = await caches.open(cacheName);
					const cachedResponse = await cache.match(event.request);
					if (cachedResponse) {
						console.log('[SW] Serving from cache:', url.pathname);
						return cachedResponse;
					}
				}
			}

			// Not in cache, try network
			try {
				const networkResponse = await fetch(event.request);

				// If request failed, just return the error
				if (!networkResponse || networkResponse.status !== 200) {
					return networkResponse;
				}

				// If caching is enabled, save this response for next time
				if (cachingEnabled) {
					const cache = await caches.open(cacheNames.core);
					cache.put(event.request, networkResponse.clone());
				}

				return networkResponse;
			} catch (error) {
				// Network request failed (user is offline)
				console.warn('[SW] Network failed for:', url.pathname, error);

				// If caching is enabled, try to find in cache again (redundant but safe)
				if (cachingEnabled) {
					const allCacheNames = Object.values(cacheNames);
					for (const cacheName of allCacheNames) {
						const cache = await caches.open(cacheName);
						const cachedResponse = await cache.match(event.request);
						if (cachedResponse) {
							console.log('[SW] Serving from cache (offline):', url.pathname);
							return cachedResponse;
						}
					}
				}

				// For page navigation, show the homepage if cached
				if (event.request.mode === 'navigate') {
					const cache = await caches.open(cacheNames.core);
					const homepageResponse = await cache.match('/');
					if (homepageResponse) {
						console.log('[SW] Serving homepage for failed navigation');
						return homepageResponse;
					}
				}

				// For images, return transparent 1x1 pixel
				if (event.request.destination === 'image') {
					return new Response(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), { headers: { 'Content-Type': 'image/gif' } });
				}

				// For fonts, return empty response
				if (event.request.destination === 'font') {
					return new Response('', {
						status: 200,
						headers: new Headers({ 'Content-Type': 'font/woff2' })
					});
				}

				// For other resources, return error
				console.error('[SW] Resource not cached and offline:', url.pathname);
				return new Response('Offline - resource not cached', {
					status: 503,
					statusText: 'Service Unavailable',
					headers: new Headers({ 'Content-Type': 'text/plain' })
				});
			}
		})()
	);
});
