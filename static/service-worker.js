const cacheName = 'qwbw-app-cache-v1';

// List of URLs or files to exclude from caching
const stuffNotToCache = ['/service-worker.js', '/service-worker-settings.json'];

// Exact files (assets, JSON, etc.)
const staticFilesToCache = [
	// '/favicon.ico',
	// '/manifest.webmanifest',
	// '/icons/icon-192.png',
	// '/icons/icon-512.png'
];

// Static routes (pages)
const staticRoutesToCache = ['/duas', '/supplications', '/bookmarks', 'morphology', '/games/guess-the-word'];

// Generate chapter routes /1 to /114
const chapterRoutesToCache = Array.from({ length: 114 }, (_, i) => `/${i + 1}`);

// Generate juz routes /juz/1 to /juz/30
const juzRoutesToCache = Array.from({ length: 30 }, (_, i) => `/juz/${i + 1}`);

self.addEventListener('install', (event) => {
	self.skipWaiting();

	event.waitUntil(
		caches.open(cacheName).then((cache) => {
			// Only precache homepage
			return cache.add('/');
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Clear old caches
			const keys = await caches.keys();
			await Promise.all(
				keys.map((key) => {
					if (key !== cacheName) {
						return caches.delete(key);
					}
				})
			);

			// Start background caching AFTER activation
			const cache = await caches.open(cacheName);

			// Helper to background-cache routes/files
			const backgroundCache = async (routes) => {
				for (const route of routes) {
					try {
						const cached = await cache.match(route);
						if (!cached) {
							const response = await fetch(route);
							if (response.ok) {
								await cache.put(route, response.clone());
							}
						}
					} catch (error) {
						console.warn(error);
					}
				}
			};

			// Background caching
			await backgroundCache(staticFilesToCache);
			await backgroundCache(staticRoutesToCache);
			await backgroundCache(chapterRoutesToCache);
			await backgroundCache(juzRoutesToCache);
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	if (event.request.method !== 'GET' || stuffNotToCache.some((excluded) => url.pathname.includes(excluded))) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((networkResponse) => {
					return caches.open(cacheName).then((cache) => {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				})
				.catch(() => caches.match('/'));
		})
	);
});
