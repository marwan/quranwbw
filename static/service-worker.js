const CACHE_NAME = 'qwbw-app-cache-v1';

// List of URLs to exclude from caching
const EXCLUDED_URLS = ['/service-worker.js', '/service-worker-settings.json', '/v1/random-words'];

self.addEventListener('install', (event) => {
	self.skipWaiting(); // Activate worker immediately
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(['/']); // Preload homepage
		})
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Check if the request should be excluded from caching
	if (event.request.method !== 'GET' || EXCLUDED_URLS.some((excluded) => url.pathname.includes(excluded))) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse; // Serve from cache
			}

			return fetch(event.request)
				.then((networkResponse) => {
					return caches.open(CACHE_NAME).then((cache) => {
						// Clone response to store in cache
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				})
				.catch(() => caches.match('/')); // Serve fallback if offline
		})
	);
});

// Clear old caches on activation
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
				})
			)
		)
	);
});
