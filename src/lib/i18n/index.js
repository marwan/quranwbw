import { browser } from '$app/environment';
import { getLocaleFromNavigator, init, register } from 'svelte-i18n';

export const defaultLocale = 'en';
export const supportedLocales = ['en', 'fr'];

register('en', () => import('./locales/en.json'));
register('fr', () => import('./locales/fr.json'));

let initialized;

export function initI18n(initialLocale = defaultLocale) {
	if (initialized) return initialized;

	let resolvedLocale = defaultLocale;

	if (browser) {
		// Check URL parameter first (for debugging)
		const params = new URLSearchParams(window.location.search);
		const langParam = params.get('lang');

		if (langParam && supportedLocales.includes(langParam)) {
			resolvedLocale = langParam;
		} else {
			// Fall back to localStorage or browser locale
			resolvedLocale = localStorage.getItem('locale') ?? getLocaleFromNavigator()?.split('-')[0] ?? defaultLocale;
		}
	} else {
		resolvedLocale = initialLocale;
	}

	initialized = init({
		fallbackLocale: defaultLocale,
		initialLocale: resolvedLocale
	});

	return initialized;
}
