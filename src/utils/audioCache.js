const AUDIO_CACHE_NAME = 'quranwbw-audio-cache';

async function getAudioCache() {
	return await caches.open(AUDIO_CACHE_NAME);
}

async function getCachedAudioUrl(url) {
	try {
		const cache = await getAudioCache();
		const cachedResponse = await cache.match(url);

		if (cachedResponse) {
			const blob = await cachedResponse.clone().blob();
			return URL.createObjectURL(blob);
		}

		return null;
	} catch (error) {
		console.warn('[AudioCache] Error getting cached audio:', error);
		return null;
	}
}

async function fetchAndCacheAudio(url) {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch audio: ${response.status}`);
		}

		const cache = await getAudioCache();
		await cache.put(url, response.clone());

		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch (error) {
		console.warn('[AudioCache] Error fetching/caching audio:', error);
		return url;
	}
}

export async function getAudioUrl(url) {
	const cachedUrl = await getCachedAudioUrl(url);
	if (cachedUrl) {
		console.log('[AudioCache] Using cached audio:', url);
		return cachedUrl;
	}

	console.log('[AudioCache] Fetching and caching audio:', url);
	return await fetchAndCacheAudio(url);
}

export async function prefetchAudio(url) {
	try {
		const cache = await getAudioCache();
		const cached = await cache.match(url);
		if (!cached) {
			fetchAndCacheAudio(url).catch(() => {});
		}
	} catch (error) {
		// Silently ignore prefetch errors
	}
}

export async function clearAudioCache() {
	try {
		await caches.delete(AUDIO_CACHE_NAME);
		console.log('[AudioCache] Cache cleared');
	} catch (error) {
		console.warn('[AudioCache] Error clearing cache:', error);
	}
}

export async function getAudioCacheStats() {
	try {
		const cache = await getAudioCache();
		const keys = await cache.keys();

		let totalSize = 0;
		for (const request of keys) {
			const response = await cache.match(request);
			if (response) {
				const blob = await response.clone().blob();
				totalSize += blob.size;
			}
		}

		return {
			entries: keys.length,
			sizeBytes: totalSize,
			sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
		};
	} catch (error) {
		console.warn('[AudioCache] Error getting stats:', error);
		return { entries: 0, sizeBytes: 0, sizeMB: '0' };
	}
}
