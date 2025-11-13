import { browser } from '$app/environment';
import { getLocaleFromNavigator, init, addMessages } from 'svelte-i18n';

export const defaultLocale = 'en';
export const supportedLocales = ['en', 'fr'];

// Define all locale modules as async imports
const localeModules = {
	en: () => ({
		main: import('./locales/en.json'),
		chapters: import('./locales/en/chapters.json'),
		mostRead: import('./locales/en/mostRead.json'),
		common: import('./locales/en/common.json'),
		tajweed: import('./locales/en/tajweed.json')
	}),
	fr: () => ({
		main: import('./locales/fr.json'),
		chapters: import('./locales/fr/chapters.json'),
		mostRead: import('./locales/fr/mostRead.json'),
		common: import('./locales/fr/common.json'),
		tajweed: import('./locales/fr/tajweed.json')
	})
};

let initialized = false;
let loadedLocales = new Set();

export async function initI18n(initialLocale = defaultLocale) {
	if (initialized) return;

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

	// Initialize svelte-i18n synchronously first to set the locale
	init({
		fallbackLocale: defaultLocale,
		initialLocale: resolvedLocale
	});

	initialized = true;

	// Then load translations asynchronously
	await loadLocale(resolvedLocale);

	// Load fallback locale if different from current
	if (resolvedLocale !== defaultLocale) {
		await loadLocale(defaultLocale);
	}

	// Add a delay to see the loading state (for testing)
	await new Promise(resolve => setTimeout(resolve, 2000));
}

// Function to load a locale dynamically
async function loadLocale(locale) {
	if (loadedLocales.has(locale) || !localeModules[locale]) {
		return;
	}

	const modules = localeModules[locale]();
	
	try {
		const [main, chapters, mostRead, common, tajweed] = await Promise.all([
			modules.main,
			modules.chapters,
			modules.mostRead,
			modules.common,
			modules.tajweed
		]);

		addMessages(locale, main.default);
		addMessages(locale, chapters.default);
		addMessages(locale, mostRead.default);
		addMessages(locale, common.default);
		addMessages(locale, tajweed.default);

		loadedLocales.add(locale);
	} catch (error) {
		console.error(`Failed to load locale "${locale}":`, error);
	}
}

// Export function to switch locales dynamically
export async function switchLocale(locale) {
	if (!supportedLocales.includes(locale)) {
		console.warn(`Locale "${locale}" is not supported`);
		return;
	}

	if (!loadedLocales.has(locale)) {
		await loadLocale(locale);
	}

	// The actual locale switching will be handled by svelte-i18n's locale store
}
