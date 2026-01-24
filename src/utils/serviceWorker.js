import { staticEndpoint } from '$data/websiteSettings';
import { get } from 'svelte/store';
import { __offlineEssentialDataEnabled } from '$utils/stores';
import { showToast } from '$utils/toast';

const WARMUP_MESSAGE = 'WARM_OFFLINE_CACHE';
const WARMUP_START_MESSAGE = 'OFFLINE_WARMUP_START';
const WARMUP_DONE_MESSAGE = 'OFFLINE_WARMUP_DONE';
const WARMUP_STAGE_MESSAGE = 'OFFLINE_WARMUP_STAGE';
const WARMUP_PROGRESS_MESSAGE = 'OFFLINE_WARMUP_PROGRESS';

const logClient = (...args) => {
	console.log('[sw-client]', ...args);
};
const warnClient = (...args) => {
	console.warn('[sw-client]', ...args);
};

let swListenersReady = false;

export async function checkAndRegisterServiceWorker() {
	// Skip in E2E test environments
	if (import.meta.env?.VITE_E2E) {
		logClient('Skipping Service Worker in E2E mode');
		return;
	}
	if (!('serviceWorker' in navigator)) {
		logClient('Service Workers are not supported in this browser.');
		return;
	}

	ensureServiceWorkerListeners();

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

		logClient('Service Worker Settings', { enabled, version });

		// If API says disabled and no SW is set, skip further processing
		if (!enabled && !swAlreadyRegistered) {
			logClient('Service Worker disabled and not registered. Skipping...');
			return;
		}

		if (enabled) {
			if (!swAlreadyRegistered) {
				navigator.serviceWorker
					.register('/service-worker.js')
					.then((registration) => {
						logClient('Service Worker Registered', { version, scope: registration.scope });
						bindRegistrationLogging(registration);
						// requestOfflineWarmup();
					})
					.catch((error) => {
						warnClient('Service Worker Registration Failed', error);
					});
			} else {
				logClient('Service Worker already registered');
				const registration = await navigator.serviceWorker.ready;
				bindRegistrationLogging(registration);
				// requestOfflineWarmup();
			}
		} else {
			logClient('Unregistering Service Worker and Deleting Cache...');
			await unregisterServiceWorkerAndClearCache(registrations);
		}
	} catch (error) {
		warnClient('Failed to fetch service worker settings', error);
		logClient('Keeping existing service worker state unchanged.');
	}
}

export async function requestOfflineWarmup(options = {}) {
	if (!('serviceWorker' in navigator)) return;
	if (!options.force && !isOfflineWarmupEnabled()) return;

	ensureServiceWorkerListeners();

	try {
		const registration = await navigator.serviceWorker.ready;
		if (!registration?.active) return;

		logClient('Requesting offline warmup', { scope: registration.scope });
		const postWarmup = () => registration.active.postMessage({ type: WARMUP_MESSAGE });
		if ('requestIdleCallback' in window) {
			requestIdleCallback(postWarmup, { timeout: 10000 });
		} else {
			setTimeout(postWarmup, 2000);
		}
	} catch (error) {
		warnClient('Failed to trigger offline warmup', error);
	}
}

export async function clearServiceWorkerCaches() {
	try {
		if (!('caches' in window)) return false;

		logClient('Clearing Cache Storage');
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
		return true;
	} catch (error) {
		warnClient('Error while clearing caches', error);
		return false;
	}
}

function isOfflineWarmupEnabled() {
	try {
		return get(__offlineEssentialDataEnabled) !== false;
	} catch (error) {
		return true;
	}
}

function ensureServiceWorkerListeners() {
	if (swListenersReady || !('serviceWorker' in navigator)) return;

	navigator.serviceWorker.addEventListener('message', (event) => {
		logClient('Message from SW', event?.data);
		const type = event?.data?.type;
		if (type === WARMUP_START_MESSAGE && isOfflineWarmupEnabled()) {
			showToast('Downloading essential offline data...');
		} else if (type === WARMUP_DONE_MESSAGE && isOfflineWarmupEnabled()) {
			showToast('Offline data is ready.');
		} else if (type === WARMUP_STAGE_MESSAGE && isOfflineWarmupEnabled()) {
			const { stage, status, total } = event?.data || {};
			logClient('Warmup stage', { stage, status, total });
		} else if (type === WARMUP_PROGRESS_MESSAGE && isOfflineWarmupEnabled()) {
			const { stage, completed, total, failures } = event?.data || {};
			logClient('Warmup progress', { stage, completed, total, failures });
		}
	});

	navigator.serviceWorker.addEventListener('messageerror', (event) => {
		warnClient('Message error from SW', event);
	});

	navigator.serviceWorker.addEventListener('controllerchange', () => {
		logClient('Controller changed', navigator.serviceWorker.controller?.state);
	});

	swListenersReady = true;
}

function bindRegistrationLogging(registration) {
	if (!registration) return;

	registration.addEventListener('updatefound', () => {
		logClient('Update found');
		const installing = registration.installing;
		if (installing) {
			logClient('Installing worker state', installing.state);
			installing.addEventListener('statechange', () => {
				logClient('Installing worker state change', installing.state);
			});
		}
	});

	if (registration.installing) {
		logClient('Current installing state', registration.installing.state);
	}
	if (registration.waiting) {
		logClient('Current waiting state', registration.waiting.state);
	}
	if (registration.active) {
		logClient('Current active state', registration.active.state);
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

		logClient('All service workers unregistered and caches cleared.');
	} catch (error) {
		warnClient('Error while clearing caches', error);
	}
}
