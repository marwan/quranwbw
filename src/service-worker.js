import { build, files, version } from '$service-worker';
import { staticEndpoint } from '$data/websiteSettings';
import { getLexiconIndexUrl, getMushafFontUrls, getOfflineAssetUrls, getOfflineJsonUrls, MUSHAF_FONT_VARIANTS } from '$utils/offlineResources';

const APP_CACHE = `app-cache-${version}`;
const DATA_CACHE = `data-cache-${version}`;
const ASSET_CACHE = `asset-cache-${version}`;
const META_CACHE = `meta-cache-${version}`;
const AUDIO_CACHE = `audio-cache-${version}`;
const IS_DEV = Boolean(import.meta && import.meta.env && import.meta.env.DEV);
const DEBUG_SW = true;
const WARMUP_MESSAGE = 'WARM_OFFLINE_CACHE';
const WARMUP_STAGE_MESSAGE = 'OFFLINE_WARMUP_STAGE';
const WARMUP_PROGRESS_MESSAGE = 'OFFLINE_WARMUP_PROGRESS';

const log = (...args) => {
	if (DEBUG_SW) console.log('[sw]', ...args);
};
const warn = (...args) => {
	if (DEBUG_SW) console.warn('[sw]', ...args);
};
const errorLog = (...args) => {
	if (DEBUG_SW) console.error('[sw]', ...args);
};

const APP_ASSETS = ['/', ...build, ...files];
const APP_ASSET_SET = new Set(APP_ASSETS);
const OFFLINE_WARMUP_MARKER = '/__offline-warmup__';

const EXCLUDED_PATHS = ['/service-worker.js', '/service-worker-settings.json', '/v1/random-words'];
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];

self.addEventListener('install', (event) => {
	self.skipWaiting();
	log('install start', { version, assets: APP_ASSETS.length });
	event.waitUntil(
		caches
			.open(APP_CACHE)
			.then((cache) => cache.addAll(APP_ASSETS))
			.then(() => log('install complete'))
			.catch((err) => errorLog('install failed', err))
	);
});

self.addEventListener('activate', (event) => {
	log('activate start');
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			const stale = keys.filter((key) => ![APP_CACHE, DATA_CACHE, ASSET_CACHE, META_CACHE, AUDIO_CACHE].includes(key));
			if (stale.length) log('activate cleanup', stale);
			await Promise.all(stale.map((key) => caches.delete(key)));
			await self.clients.claim();
			log('activate complete');
		})().catch((err) => errorLog('activate failed', err))
	);
});

// ... (imports remain)

const RECACHE_SPECIFIC_RESOURCE_MESSAGE = 'CACHE_SPECIFIC_RESOURCE';

self.addEventListener('message', (event) => {
	log('message received', event?.data);
	if (event?.data?.type === WARMUP_MESSAGE) {
		event.waitUntil(warmOfflineCaches(event.data));
	} else if (event?.data?.type === RECACHE_SPECIFIC_RESOURCE_MESSAGE) {
        event.waitUntil(cacheSpecificResources(event.data));
    }
});

// ... (fetch listener and others remain the same)

async function cacheSpecificResources(data) {
    const { urls, cacheName, label } = data;
    if (!urls || !urls.length) return;

    log(`caching specific resources: ${label}`, { count: urls.length });
    await notifyClients({
        type: 'CACHE_RESOURCE_START',
        label,
        total: urls.length
    });

    try {
        await warmCache(cacheName, urls, { concurrency: 4, label });
        await notifyClients({
            type: 'CACHE_RESOURCE_DONE',
            label,
            total: urls.length
        });
    } catch (err) {
        errorLog('cacheSpecificResources failed', err);
        await notifyClients({
            type: 'CACHE_RESOURCE_ERROR',
            label,
            error: err.message
        });
    }
}

// ... (warmOfflineCaches and others remain)


self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	if (shouldBypassCache(request, url)) {
		log('fetch bypass', url.pathname);
		return;
	}

	if (isAudioRequest(request, url)) {
		log('fetch audio', url.pathname);
		event.respondWith(cacheOnlyOrNetwork(request));
		return;
	}

	if (request.mode === 'navigate') {
		log('fetch navigation', url.pathname);
		event.respondWith(networkFirst(request, APP_CACHE, { ignoreSearch: true }));
		return;
	}

	if (APP_ASSET_SET.has(url.pathname) || url.pathname.startsWith('/_app/')) {
		log('fetch app asset', url.pathname);
		event.respondWith(cacheFirst(request, APP_CACHE, { ignoreSearch: true }));
		return;
	}

	if (isJsonRequest(request, url)) {
		log('fetch json', url.pathname);
		event.respondWith(staleWhileRevalidate(event, request, DATA_CACHE));
		return;
	}

	if (isAssetRequest(request, url)) {
		log('fetch asset', url.pathname);
		event.respondWith(staleWhileRevalidate(event, request, ASSET_CACHE, { ignoreSearch: true }));
		return;
	}

	log('fetch fallback', url.pathname);
	event.respondWith(networkFirst(request, DATA_CACHE));
});

self.addEventListener('error', (event) => {
	errorLog('error event', event?.message || event);
});

self.addEventListener('unhandledrejection', (event) => {
	errorLog('unhandled rejection', event?.reason || event);
});

function shouldBypassCache(request, url) {
	if (request.cache === 'no-store') return true;
	return EXCLUDED_PATHS.some((path) => url.pathname.includes(path));
}

function isAudioRequest(request, url) {
	if (request.destination === 'audio') return true;
	return AUDIO_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isJsonRequest(request, url) {
	if (url.pathname.endsWith('.json')) return true;
	const accept = request.headers.get('accept') || '';
	return accept.includes('application/json');
}

function isAssetRequest(request, url) {
	if (['style', 'script', 'image', 'font'].includes(request.destination)) return true;
	return /\.(?:css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|pdf)$/i.test(url.pathname);
}

async function cacheFirst(request, cacheName, matchOptions) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request, matchOptions);
	if (cached) {
		log('cache-first hit', { cacheName, url: request.url });
		return cached;
	}

	const response = await fetch(request);
	if (response && (response.ok || response.type === 'opaque')) {
		cache.put(request, response.clone());
		log('cache-first store', { cacheName, url: request.url });
	}
	return response;
}

async function networkFirst(request, cacheName, matchOptions) {
	const cache = await caches.open(cacheName);
	try {
		log('network-first fetch', { cacheName, url: request.url });
		const response = await fetch(request);
		if (response && (response.ok || response.type === 'opaque')) {
			cache.put(request, response.clone());
			log('network-first store', { cacheName, url: request.url });
		}
		return response;
	} catch (error) {
		warn('network-first fetch failed', { cacheName, url: request.url, error });
		const cached = await cache.match(request, matchOptions);
		if (cached) {
			log('network-first cache fallback', { cacheName, url: request.url });
			return cached;
		}
		if (request.mode === 'navigate') {
			const fallback = await cache.match('/', matchOptions);
			if (fallback) return fallback;
		}
		return Response.error();
	}
}

async function staleWhileRevalidate(event, request, cacheName, matchOptions) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request, matchOptions);
	if (cached) {
		log('stale-while-revalidate hit', { cacheName, url: request.url });
	}

	const fetchPromise = fetch(request)
		.then((response) => {
			if (response && (response.ok || response.type === 'opaque')) {
				cache.put(request, response.clone());
				log('stale-while-revalidate store', { cacheName, url: request.url });
			}
			return response;
		})
		.catch((err) => {
			warn('stale-while-revalidate fetch failed', { cacheName, url: request.url, err });
			return null;
		});

	event.waitUntil(fetchPromise);

	if (cached) return cached;
	const network = await fetchPromise;
	return network || Response.error();
}

async function cacheOnlyOrNetwork(request) {
	const cache = await caches.open(AUDIO_CACHE);
	const cached = await cache.match(request);
	if (cached) {
		log('audio cache hit', request.url);
		return cached;
	}
	log('audio cache miss', request.url);
	return fetch(request);
}

let warmupPromise = null;

async function warmOfflineCaches(options = {}) {
	if (warmupPromise) return warmupPromise;

	warmupPromise = (async () => {
		try {
			log('warmup start');
			if (await isWarmupDone()) {
				log('warmup already done');
				await notifyClients({
					type: WARMUP_STAGE_MESSAGE,
					stage: 'all',
					status: 'skipped',
					total: 0
				});
				return;
			}

			await notifyClients({ type: 'OFFLINE_WARMUP_START' });

			const dataUrls = getOfflineJsonUrls();
			await notifyClients({
				type: WARMUP_STAGE_MESSAGE,
				stage: 'json',
				status: 'start',
				total: dataUrls.length
			});
			log('warmup json urls', dataUrls.length);
			await warmCache(DATA_CACHE, dataUrls, { concurrency: 4, label: 'json' });
			await notifyClients({
				type: WARMUP_STAGE_MESSAGE,
				stage: 'json',
				status: 'done',
				total: dataUrls.length
			});

			const lexiconUrls = await getLexiconFileUrls();
			if (lexiconUrls.length > 0) {
				await notifyClients({
					type: WARMUP_STAGE_MESSAGE,
					stage: 'lexicon',
					status: 'start',
					total: lexiconUrls.length
				});
				log('warmup lexicon urls', lexiconUrls.length);
				await warmCache(DATA_CACHE, lexiconUrls, { concurrency: 4, label: 'lexicon' });
				await notifyClients({
					type: WARMUP_STAGE_MESSAGE,
					stage: 'lexicon',
					status: 'done',
					total: lexiconUrls.length
				});
			}

			const assetUrls = getOfflineAssetUrls();
			const variantKeys = Array.isArray(options.mushafVariants) && options.mushafVariants.length > 0 ? options.mushafVariants : null;
			const variants = variantKeys ? MUSHAF_FONT_VARIANTS.filter((variant) => variantKeys.includes(variant.key)) : MUSHAF_FONT_VARIANTS;
			const mushafUrls = getMushafFontUrls(variants);
			await notifyClients({
				type: WARMUP_STAGE_MESSAGE,
				stage: 'assets',
				status: 'start',
				total: assetUrls.length + mushafUrls.length
			});
			log('warmup asset urls', assetUrls.length);
			log('warmup mushaf urls', mushafUrls.length);
			await warmCache(ASSET_CACHE, [...assetUrls, ...mushafUrls], { concurrency: 4, label: 'assets' });
			await notifyClients({
				type: WARMUP_STAGE_MESSAGE,
				stage: 'assets',
				status: 'done',
				total: assetUrls.length + mushafUrls.length
			});

			await setWarmupDone();
			await notifyClients({ type: 'OFFLINE_WARMUP_DONE' });
			log('warmup complete');
		} finally {
			warmupPromise = null;
		}
	})();

	return warmupPromise;
}

async function warmCache(cacheName, urls, { concurrency = 4, label = 'cache' } = {}) {
	const cache = await caches.open(cacheName);
	const uniqueUrls = [...new Set(urls)];
	let index = 0;
	let completed = 0;
	const total = uniqueUrls.length;
	const logEvery = Math.max(25, Math.ceil(total / 20));
	let failures = 0;
	let lastProgressSentAt = 0;

	const logProgress = () => {
		if (!DEBUG_SW) return;
		console.log(`[sw] warmup ${label}: ${completed}/${total} (failures: ${failures})`);
	};

	log(`warmup ${label} started`, { total, cacheName });

	const notifyProgress = async (force = false) => {
		const now = Date.now();
		if (!force && now - lastProgressSentAt < 1500) return;
		lastProgressSentAt = now;

		await notifyClients({
			type: WARMUP_PROGRESS_MESSAGE,
			stage: label,
			completed,
			total,
			failures
		});
	};

	const worker = async () => {
		while (index < uniqueUrls.length) {
			const url = uniqueUrls[index];
			index += 1;

			const request = new Request(url, { mode: 'cors', credentials: 'omit' });
			try {
				const cached = await cache.match(request);
				if (cached) continue;

				const response = await fetch(request);
				if (response && (response.ok || response.type === 'opaque')) {
					await cache.put(request, response.clone());
				}
			} catch (error) {
				// Ignore fetch failures during warmup.
				failures += 1;
			} finally {
				completed += 1;
				if (completed === total || completed % logEvery === 0) {
					logProgress();
					await notifyProgress(completed === total);
				}
			}
		}
	};

	const workerCount = Math.max(1, concurrency);
	await Promise.all(Array.from({ length: workerCount }, () => worker()));

	log(`warmup ${label} completed`, { total, failures });
	await notifyProgress(true);
}

async function getLexiconFileUrls() {
	const indexUrl = getLexiconIndexUrl();
	const cache = await caches.open(DATA_CACHE);

	let indexData;
	const cached = await cache.match(indexUrl);
	if (cached) {
		try {
			indexData = await cached.clone().json();
		} catch (error) {
			indexData = null;
		}
	} else {
		try {
			const response = await fetch(indexUrl, { mode: 'cors', credentials: 'omit' });
			if (!response.ok) return [];
			indexData = await response.clone().json();
			await cache.put(indexUrl, response);
		} catch (error) {
			return [];
		}
	}

	if (!indexData || typeof indexData !== 'object') return [];
	const files = new Set(Object.values(indexData).map((entry) => entry?.file).filter(Boolean));
	log('lexicon files', files.size);
	return Array.from(files).map((file) => `${staticEndpoint}/lexicon/${file}.json`);
}

async function isWarmupDone() {
	const cache = await caches.open(META_CACHE);
	const marker = await cache.match(OFFLINE_WARMUP_MARKER);
	log('warmup marker', Boolean(marker));
	return Boolean(marker);
}

async function setWarmupDone() {
	const cache = await caches.open(META_CACHE);
	const body = JSON.stringify({ warmedAt: Date.now() });
	await cache.put(OFFLINE_WARMUP_MARKER, new Response(body, { headers: { 'Content-Type': 'application/json' } }));
	log('warmup marker set');
}

async function notifyClients(message) {
	try {
		const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
		log('notify clients', { count: clients.length, message });
		await Promise.all(clients.map((client) => client.postMessage(message)));
	} catch (error) {
		warn('notify clients failed', error);
	}
}
