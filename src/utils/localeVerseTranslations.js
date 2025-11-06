import { selectableVerseTranslations } from '$data/options';
import { localeTranslationPreferences } from '$utils/localeTranslationPreferences';

const availableTranslationIds = new Set(
	Object.values(selectableVerseTranslations).map(({ resource_id }) => resource_id)
);

const pickTranslationId = (localeCode) => {
	const candidates = localeTranslationPreferences[localeCode];
	if (!Array.isArray(candidates)) return null;
	return candidates.find((id) => availableTranslationIds.has(id)) ?? null;
};

const getNavigatorLocales = () => {
	if (typeof navigator === 'undefined') return [];

	const locales = [
		...(Array.isArray(navigator.languages) ? navigator.languages : []),
		...(typeof navigator.language === 'string' ? [navigator.language] : []),
		...(typeof navigator.userLanguage === 'string' ? [navigator.userLanguage] : []),
	];

	return locales.filter((locale) => typeof locale === 'string' && locale.trim());
};

export function resolvePreferredLocaleTranslationId(locale) {
	if (!locale) return null;

	const parts = locale.toLowerCase().split('-');
	while (parts.length > 0) {
		const translationId = pickTranslationId(parts.join('-'));
		if (translationId) return translationId;
		parts.pop();
	}

	return null;
}

export function getPreferredLocaleTranslationId() {
	const seen = new Set();

	for (const locale of getNavigatorLocales()) {
		const normalized = locale.trim().toLowerCase();
		if (seen.has(normalized)) continue;
		seen.add(normalized);

		const translationId = resolvePreferredLocaleTranslationId(locale);
		if (translationId) return translationId;
	}

	return null;
}
