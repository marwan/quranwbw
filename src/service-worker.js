import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const cacheName = `quranwbw-cache-${version}`;

// List of URLs or files to exclude from caching
const stuffNotToCache = ['/service-worker.js', '/service-worker-settings.json'];

const precacheFiles = [
	...files, // Static files from /static folder
	...build // Generated JS/CSS chunks (includes the main bundle)
];

// Static routes (pages)
const staticRoutesToCache = ['/duas', '/supplications', '/bookmarks', '/morphology', '/games/guess-the-word', '/offline'];

// Generate chapter routes /1 to /114
const chapterRoutesToCache = Array.from({ length: 114 }, (_, i) => `/${i + 1}`);

// Generate juz routes /juz/1 to /juz/30
const juzRoutesToCache = Array.from({ length: 30 }, (_, i) => `/juz/${i + 1}`);

// Flag to check if user has explicitly enabled caching
let cachingEnabled = false;

self.addEventListener('install', () => {
	// Skip waiting immediately but don't cache yet
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Delete old caches ONLY AFTER new cache is ready
			const keys = await caches.keys();
			await Promise.all(
				keys.map((key) => {
					if (key !== cacheName) {
						console.log('Deleting old cache:', key);
						return caches.delete(key);
					}
				})
			);

			await self.clients.claim();
		})()
	);
});

// Listen for message to start caching
self.addEventListener('message', (event) => {
	if (event.data.type === 'START_CACHING') {
		cachingEnabled = true;
		event.waitUntil(
			(async () => {
				const cache = await caches.open(cacheName);

				// Notify: starting cache
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'CACHE_STARTED' });
				});

				// Cache homepage and build files
				await cache.addAll(['/', ...precacheFiles]);

				// Background cache routes during install
				const backgroundCache = async (routes, label) => {
					const total = routes.length;
					for (let i = 0; i < routes.length; i++) {
						try {
							const response = await fetch(routes[i]);
							if (response.ok) {
								await cache.put(routes[i], response.clone());
							}
						} catch (error) {
							console.warn('Install cache failed for:', routes[i], error);
						}

						// Send progress
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

				await backgroundCache(staticRoutesToCache, 'static-routes');
				await backgroundCache(chapterRoutesToCache, 'chapters');
				await backgroundCache(juzRoutesToCache, 'juz');

				// Now that everything is cached, skip waiting
				// Notify: cache complete
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
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	if (event.request.method !== 'GET' || stuffNotToCache.some((excluded) => url.pathname.includes(excluded))) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			// Only use cache if caching was explicitly enabled
			if (cachedResponse && cachingEnabled) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((networkResponse) => {
					// Only cache successful responses
					if (!networkResponse || networkResponse.status !== 200) {
						return networkResponse;
					}

					// Only cache if caching was explicitly enabled
					if (cachingEnabled) {
						return caches.open(cacheName).then((cache) => {
							cache.put(event.request, networkResponse.clone());
							return networkResponse;
						});
					}

					return networkResponse;
				})
				.catch(() => {
					// Only return homepage fallback for navigation requests
					if (event.request.mode === 'navigate' && cachingEnabled) {
						return caches.match('/');
					}

					// For other requests (JS, CSS, fonts, images, etc.), return a proper error
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
