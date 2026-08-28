/* eslint-disable no-case-declarations */
import { get } from 'svelte/store';
import {
	__currentPage,
	__userSettings,
	__fontType,
	__displayType,
	__websiteTheme,
	__wordTranslation,
	__wordTransliteration,
	__verseTranslations,
	__verseTafsir,
	__wordTranslationEnabled,
	__wordTransliterationEnabled,
	__reciter,
	__translationReciter,
	__playbackSpeed,
	__audioSettings,
	__lastRead,
	__wordTooltip,
	__userBookmarks,
	__userColoredBookmarks,
	__userFavoriteChapters,
	__wakeLockEnabled,
	__userNotes,
	__quizCorrectAnswers,
	__quizWrongAnswers,
	__englishTerminology,
	__hideNonDuaPart,
	__playButtonsFunctionality,
	__wordMorphologyOnClick,
	__wideWesbiteLayoutEnabled,
	__signLanguageModeEnabled,
	__offlineModeSettings,
	__homepageLayoutPreferences
} from '$utils/stores';
import { fetchChapterData, fetchVerseTranslationData } from '$utils/fetchData';
import { isValidVerseKey } from '$utils/validateKey';

// function to update website settings
export function updateSettings(props) {
	// get the settings from localStorage
	const userSettings = JSON.parse(localStorage.getItem('userSettings'));
	let trackEvent = false;
	let coloredResult = null;
	let skipGenericPersist = false;
	// let uploadSettings = false;

	switch (props.type) {
		// for chapter number
		case 'chapter':
			userSettings.chapter = props.value;
			break;

		// for font types
		case 'fontType':
			__fontType.set(props.value);
			if (props.preventStoreUpdate) return;
			userSettings.displaySettings.fontType = props.value;
			trackEvent = true;

			// Toggle in offline mode settings
			toggleDownloadedDataSetting(userSettings.offlineModeSettings, 'fontTypes', props.value);

			break;

		// for display types
		case 'displayType':
			__displayType.set(props.value);
			if (props.preventStoreUpdate) return;
			userSettings.displaySettings.displayType = props.value;
			if (!props.skipTrackEvent) trackEvent = true;
			break;

		// for word tooltip
		case 'wordTooltip':
			__wordTooltip.set(props.value);
			userSettings.displaySettings.wordTooltip = props.value;
			trackEvent = true;
			break;

		// for terminologies language
		case 'englishTerminology':
			__englishTerminology.set(props.value);
			userSettings.displaySettings.englishTerminology = props.value;
			trackEvent = true;
			location.reload();
			break;

		// for website theme
		case 'websiteTheme':
			__websiteTheme.set(props.value);
			userSettings.displaySettings.websiteTheme = props.value;
			trackEvent = true;
			location.reload();
			break;

		// for word translation view
		case 'wordTranslationEnabled':
			__wordTranslationEnabled.set(props.value);
			userSettings.displaySettings.wordTranslationEnabled = props.value;
			break;

		// for word transliteration view
		case 'wordTransliterationEnabled':
			__wordTransliterationEnabled.set(props.value);
			userSettings.displaySettings.wordTransliterationEnabled = props.value;
			break;

		// for word translation
		case 'wordTranslation':
			__wordTranslation.set(props.value);
			userSettings.translations.word = props.value;
			trackEvent = true;

			// Toggle in offline mode settings
			toggleDownloadedDataSetting(userSettings.offlineModeSettings, 'wordTranslations', props.value);

			break;

		// for word transliteration
		case 'wordTransliteration':
			__wordTransliteration.set(props.value);
			userSettings.transliteration.word = props.value;
			trackEvent = true;

			// Toggle in offline mode settings
			toggleDownloadedDataSetting(userSettings.offlineModeSettings, 'wordTransliterations', props.value);

			break;

		// for verse translations
		case 'verseTranslation':
			let verseTranslations = userSettings.translations.verse_v1;

			// if the translation already exists, then remove it, else add it
			verseTranslations.includes(props.value) ? (verseTranslations = verseTranslations.filter((x) => x !== props.value)) : verseTranslations.push(props.value);

			// update the verse translations
			userSettings.translations.verse_v1 = verseTranslations;
			__verseTranslations.set(verseTranslations);

			// Toggle in offline mode settings
			toggleDownloadedDataSetting(userSettings.offlineModeSettings, 'verseTranslations', props.value);

			break;

		// for verse tafsir
		case 'verseTafsir':
			__verseTafsir.set(props.value);
			userSettings.translations.tafsir = props.value;
			trackEvent = true;
			break;

		// for verse reciter
		case 'reciter':
			__reciter.set(props.value);
			userSettings.audioSettings.reciter = props.value;
			trackEvent = true;
			break;

		// for translation reciter
		case 'translationReciter':
			__translationReciter.set(props.value);
			userSettings.audioSettings.translationReciter = props.value;
			trackEvent = true;
			break;

		// for playback speed
		case 'playbackSpeed':
			__playbackSpeed.set(props.value);
			userSettings.audioSettings.playbackSpeed = props.value;
			break;

		// for audio settings
		case 'audioSettings':
			__audioSettings.set(props.value);
			userSettings.audioSettings = props.value;
			break;

		case 'userBookmarks':
			const key = props.key;
			let userBookmarks = userSettings['userBookmarks'];

			// if override key was set, then just set the value key in localStorage
			if (props.override) {
				userSettings.userBookmarks = key;
			}

			// else just set what was provided as key invidually post validation
			else {
				// for old imports, only push if bookmark doesn't exist
				if (props.oldCheck) {
					if (!userBookmarks.includes(key)) userBookmarks.push(key);
				}

				// for existing bookmarks...
				// if the bookmark (key) already exists, then remove it, else add it
				else userBookmarks.includes(key) ? (userBookmarks = userBookmarks.filter((x) => x !== key)) : userBookmarks.push(key);

				// update the bookmarks
				userSettings.userBookmarks = userBookmarks;
			}

			__userBookmarks.set(userBookmarks);
			break;

		case 'userFavoriteChapters':
			const chapterKey = props.key;
			let userFavoriteChapters = userSettings['userFavoriteChapters'];

			if (props.override) {
				// Directly replace the entire favorites list (e.g. on initial load or bulk update)
				userSettings.userFavoriteChapters = chapterKey;
				userFavoriteChapters = chapterKey;
			} else {
				// Toggle: remove the chapter if already favorited, add it if not
				if (userFavoriteChapters.includes(chapterKey)) {
					userFavoriteChapters = userFavoriteChapters.filter((x) => x !== chapterKey);
					window.umami?.track('Remove Chapter From Favorites');
				} else {
					userFavoriteChapters.push(chapterKey);
					window.umami?.track('Add Chapter To Favorites');
				}
				userSettings.userFavoriteChapters = userFavoriteChapters;
			}

			__userFavoriteChapters.set(userFavoriteChapters);
			break;

		case 'userNotes':
			const value = props.value;
			const notes_key = props.key;
			const isWhitespaceString = (str) => !str.replace(/\s/g, '').length;
			let userNotes = userSettings['userNotes'];

			// if override key was set, then just set the value key in localStorage
			if (props.override) {
				userSettings.userNotes = notes_key;
			}

			// else just set what was provided as key invidually post validation
			else {
				// we only save the note if it's not just only whitespace
				if (!isWhitespaceString(value)) {
					userNotes[notes_key] = {
						note: value,
						modified_at: new Date().toISOString()
					};
				} else if (value.length === 0) {
					if (Object.prototype.hasOwnProperty.call(userNotes, notes_key)) delete userNotes[notes_key];
				}

				// update the notes
				userSettings.userNotes = userNotes;
			}

			__userNotes.set(userNotes);
			break;

		// for last read
		case 'lastRead':
			if (['chapter', 'mushaf', 'juz', 'hizb'].includes(get(__currentPage))) {
				const data = props.value;
				data['currentPage'] = get(__currentPage);
				__lastRead.set(data);
				userSettings.lastRead = props.value;
			}
			break;

		// for toggling wakeLock
		case 'wakeLockEnabled':
			__wakeLockEnabled.set(props.value);
			userSettings.displaySettings.wakeLockEnabled = props.value;
			break;

		// for toggling non-dua words
		case 'hideNonDuaPart':
			__hideNonDuaPart.set(props.value);
			userSettings.displaySettings.hideNonDuaPart = props.value;
			break;

		// for quiz correct answers
		case 'quizCorrectAnswers':
			__quizCorrectAnswers.set(props.value);
			userSettings.quiz.correctAnswers = props.value;
			break;

		// for quiz wrong answers
		case 'quizWrongAnswers':
			__quizWrongAnswers.set(props.value);
			userSettings.quiz.wrongAnswers = props.value;
			break;

		// for verse play button
		case 'versePlayButton':
			__playButtonsFunctionality.set({
				verse: props.value,
				toolbar: 1
			});
			userSettings.audioSettings.versePlayButton = props.value;
			break;

		// for toggling word morphology on click
		case 'wordMorphologyOnClick':
			__wordMorphologyOnClick.set(props.value);
			userSettings.displaySettings.wordMorphologyOnClick = props.value;
			break;

		// for toggling website wide layout
		case 'wideWesbiteLayoutEnabled':
			__wideWesbiteLayoutEnabled.set(props.value);
			userSettings.displaySettings.wideWesbiteLayoutEnabled = props.value;
			break;

		// for toggling sign language mode
		case 'signLanguageModeEnabled':
			__signLanguageModeEnabled.set(props.value);
			userSettings.displaySettings.signLanguageModeEnabled = props.value;
			break;

		// for offline mode settings
		case 'offlineModeSettings':
			__offlineModeSettings.set(props.value);
			userSettings.offlineModeSettings = props.value;
			break;

		case 'userColoredBookmarks': {
			const VALID_COLOR_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
			const isValidColorId = (v) => {
				const n = Number(v);
				return Number.isInteger(n) && VALID_COLOR_IDS.has(n);
			};
			const COLOR_ALIAS_MAP = {
				amber: 1,
				amberglow: 1,
				'amber-glow': 1,
				terracotta: 2,
				dune: 2,
				terracottadune: 2,
				'terracotta-dune': 2,
				rose: 3,
				roseash: 3,
				'rose-ash': 3,
				lavender: 4,
				mist: 4,
				lavendermist: 4,
				'lavender-mist': 4,
				slate: 5,
				powder: 5,
				powderslate: 5,
				'powder-slate': 5,
				sage: 6,
				teal: 6,
				sageteal: 6,
				'sage-teal': 6,
				olive: 7,
				olivesage: 7,
				'olive-sage': 7,
				stone: 8,
				taupe: 8,
				stonetaupe: 8,
				'stone-taupe': 8
			};
			const resolveColorAlias = (input) => {
				if (input == null) return null;
				const s = String(input).trim().toLowerCase();
				if (/^[1-8]$/.test(s)) return Number(s);
				if (COLOR_ALIAS_MAP[s] != null) return COLOR_ALIAS_MAP[s];
				const n = Number(s);
				if (isValidColorId(n)) return n;
				return null;
			};

			const isQuotaError = (e) => e && (e.code === 22 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

			// ensure map exists
			if (!userSettings.userColoredBookmarks || typeof userSettings.userColoredBookmarks !== 'object' || Array.isArray(userSettings.userColoredBookmarks)) {
				userSettings.userColoredBookmarks = {};
			}
			const snapshot = JSON.parse(JSON.stringify(userSettings.userColoredBookmarks));

			let result = null;
			try {
				// bulk override
				if (props.override !== undefined && props.override !== false && props.override !== null) {
					const bulk = props.override;
					if (typeof bulk !== 'object' || Array.isArray(bulk)) {
						result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: 'override must be Record<verseKey, colorId>' } };
					} else {
						const invalid = [];
						const normalizedBulk = {};
						for (const [k, v] of Object.entries(bulk)) {
							if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
								invalid.push(k);
								continue;
							}
							const normKey = (() => {
								const t = String(k).trim();
								const parts = t.split(':');
								if (parts.length !== 2) return t;
								return `${Number(parts[0])}:${Number(parts[1])}`;
							})();
							if (!isValidVerseKey(normKey)) {
								invalid.push(k);
								continue;
							}
							const n = Number(v);
							if (!isValidColorId(n)) {
								invalid.push(k);
								continue;
							}
							normalizedBulk[normKey] = n;
						}
						if (invalid.length > 0) {
							result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: `Invalid entries: ${invalid.join(', ')}`, details: { invalidKeys: invalid } } };
						} else {
							userSettings.userColoredBookmarks = normalizedBulk;
							if (Object.keys(normalizedBulk).length > 0) window.umami?.track('Colored Bookmarks Bulk Override', { count: Object.keys(normalizedBulk).length });
							result = { status: 200, ok: true, action: 'bulk', totalColored: Object.keys(normalizedBulk).length };
						}
					}
				} else {
					// single verse mode
					if (!props.key) {
						result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: 'verseKey required' } };
					} else {
						const rawKey = String(props.key).trim();
						const parts = rawKey.split(':');
						const normalizedKey = parts.length === 2 ? `${Number(parts[0])}:${Number(parts[1])}` : rawKey;
						if (normalizedKey === '__proto__' || normalizedKey === 'constructor' || normalizedKey === 'prototype') {
							result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid verseKey' } };
						} else if (!isValidVerseKey(normalizedKey)) {
							result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: `Invalid verseKey "${props.key}": failed isValidVerseKey`, details: { key: props.key, constraint: 'isValidVerseKey' } } };
						} else if (props.clear) {
							const existing = userSettings.userColoredBookmarks[normalizedKey];
							if (existing == null) {
								result = { status: 204, ok: true, key: normalizedKey, action: 'noop', totalColored: Object.keys(userSettings.userColoredBookmarks).length };
							} else {
								const cleared = existing;
								delete userSettings.userColoredBookmarks[normalizedKey];
								window.umami?.track('Colored Bookmark Clear', { verseKey: normalizedKey, clearedColorId: cleared });
								result = { status: 200, ok: true, key: normalizedKey, action: 'clear', totalColored: Object.keys(userSettings.userColoredBookmarks).length };
							}
						} else {
							let colorId = null;
							if (props.colorId !== undefined && props.colorId !== null) colorId = Number(props.colorId);
							else if (props.color !== undefined && props.color !== null) colorId = resolveColorAlias(props.color);
							if (colorId == null || !isValidColorId(colorId)) {
								result = { status: 400, ok: false, error: { code: 'VALIDATION_ERROR', message: `Invalid colorId "${props.colorId ?? props.color}"`, details: { colorId: props.colorId ?? props.color, allowed: [1, 2, 3, 4, 5, 6, 7, 8] } } };
							} else {
								const existing = userSettings.userColoredBookmarks[normalizedKey];
								if (existing === colorId) {
									result = { status: 204, ok: true, key: normalizedKey, colorId, action: 'noop', totalColored: Object.keys(userSettings.userColoredBookmarks).length };
								} else {
									const action = existing == null ? 'set' : 'replace';
									userSettings.userColoredBookmarks[normalizedKey] = colorId;
									if (action === 'set') {
										const names = { 1: 'Amber Glow', 2: 'Terracotta Dune', 3: 'Rose Ash', 4: 'Lavender Mist', 5: 'Powder Slate', 6: 'Sage Teal', 7: 'Olive Sage', 8: 'Stone Taupe' };
										window.umami?.track('Colored Bookmark Set', { verseKey: normalizedKey, colorId, colorName: names[colorId] ?? String(colorId) });
									} else {
										window.umami?.track('Colored Bookmark Change', { verseKey: normalizedKey, fromColorId: existing, toColorId: colorId });
									}
									result = { status: 200, ok: true, key: normalizedKey, colorId, action, totalColored: Object.keys(userSettings.userColoredBookmarks).length };
								}
							}
						}
					}
				}

				// validation error -> revert & return
				if (result && result.status === 400) {
					userSettings.userColoredBookmarks = snapshot;
					coloredResult = result;
					skipGenericPersist = true;
					break;
				}
				if (result && result.status === 204) {
					// noop -> no write needed, but ensure store sync (no change)
					coloredResult = result;
					skipGenericPersist = true;
					// restore snapshot to be safe (no mutation)
					userSettings.userColoredBookmarks = snapshot;
					// check if we actually didn't mutate (noop case restored)
					// but if noop we already rewound; need to keep original map
					// For noop, snapshot === current, so keep snapshot
					break;
				}
				// success write path
				try {
					__userColoredBookmarks.set(userSettings.userColoredBookmarks);
					__userSettings.set(JSON.stringify(userSettings));
					localStorage.setItem('userSettings', JSON.stringify(userSettings));
					coloredResult = result;
				} catch (e) {
					userSettings.userColoredBookmarks = snapshot;
					try {
						__userColoredBookmarks.set(snapshot);
					} catch (_err) {
						// ignore
					}
					if (isQuotaError(e)) {
						coloredResult = { status: 507, ok: false, error: { code: 'QUOTA_EXCEEDED', message: 'Storage full — couldn\'t save color. Try clearing old bookmarks/notes and retry.' } };
					} else {
						coloredResult = { status: 500, ok: false, error: { code: 'STORAGE_ERROR', message: e.message || 'Storage error' } };
					}
				}
				skipGenericPersist = true;
			} catch (e) {
				userSettings.userColoredBookmarks = snapshot;
				try {
					__userColoredBookmarks.set(snapshot);
				} catch (_err) {
					// ignore
				}
				coloredResult = { status: 500, ok: false, error: { code: 'STORAGE_ERROR', message: e.message || 'Storage error' } };
				skipGenericPersist = true;
			}
			break;
		}

		// for homepage layout preferences
		case 'homepageLayoutPreferences':
			__homepageLayoutPreferences.set(props.value);
			userSettings.displaySettings.homepageLayoutPreferences = props.value;
			break;

		// Increase/decrease font sizes by swapping the Tailwind font size class on all
		// matching elements and persisting the new size to userSettings.
		// Elements use a `data-fontSize` attribute to track their current size class,
		// avoiding the need to guess which class to remove before adding the new one.
		case 'arabicText': // Arabic words
		case 'wordTranslationText': // word translations & transliterations
		case 'verseTranslationText': // verse translations & transliterations
			if (!props.value) break;

			document.querySelectorAll(`.${props.type}`).forEach((element) => {
				// e.g. "text-2xl"
				const currentSize = element.getAttribute('data-fontSize');

				// Swap old size for new
				element.classList.replace(currentSize, props.value);

				// Keep attribute in sync
				element.setAttribute('data-fontSize', props.value);
			});

			// Persist outside the loop — same value for all elements, only needs to run once
			userSettings.displaySettings.fontSizes[props.type] = props.value;
			break;
	}

	// Track event change
	if (trackEvent) {
		// window.umami.track('Setting Change', { type: props.type, value: props.value });
	}

	if (skipGenericPersist) {
		return coloredResult;
	}

	// update the settings back into localStorage and global store
	__userSettings.set(JSON.stringify(userSettings));
	localStorage.setItem('userSettings', JSON.stringify(userSettings));
	return { status: 200, ok: true };
}

// Toggle downloaded data setting (add if not present, remove if present)
function toggleDownloadedDataSetting(offlineModeSettings, type, id) {
	// Check if service worker is registered and downloadedDataSettings exists
	if (!offlineModeSettings?.serviceWorker?.downloaded || !offlineModeSettings?.downloadedDataSettings) {
		return;
	}

	// Ensure the array exists
	if (!offlineModeSettings.downloadedDataSettings[type]) {
		offlineModeSettings.downloadedDataSettings[type] = [];
	}

	const array = offlineModeSettings.downloadedDataSettings[type];
	const index = array.indexOf(id);

	// If doesn't exist, add it
	if (index === -1) {
		array.push(id);
	}

	// Download all data again as per current user's settings
	fetchChapterData({ chapter: 1, preventStoreUpdate: true });
	fetchVerseTranslationData({ preventStoreUpdate: true });

	// Update the store
	__offlineModeSettings.set(offlineModeSettings);
}
