<script>
	import '$utils/checkURLParameters';
	import '$utils/keyDownHandler';
	import '$utils/devTools';
	import '$utils/generateThemes';
	import Navbar from '$ui/Navbar.svelte';
	import SettingsDrawer from '$ui/SettingsDrawer/SettingsDrawer.svelte';
	import BottomToolbar from '$ui/BottomToolbar/BottomToolbar.svelte';
	import AudioModal from '$ui/Modals/AudioModal.svelte';
	import TajweedRulesModal from '$ui/Modals/TajweedRulesModal.svelte';
	import NotesModal from '$ui/Modals/NotesModal.svelte';
	import TafsirModal from '$ui/Modals/TafsirModal.svelte';
	import QuranNavigationModal from '$ui/Modals/QuranNavigationModal.svelte';
	import SiteNavigationModal from '$ui/Modals/SiteNavigationModal.svelte';
	import SettingsSelectorModal from '$ui/Modals/SettingsSelectorModal.svelte';
	import VerseTranslationModal from '$ui/Modals/VerseTranslationModal.svelte';
	import MorphologyModal from '$ui/Modals/MorphologyModal.svelte';
	import CopyShareVerseModal from '$ui/Modals/CopyShareVerseModal.svelte';
	import ConfirmationAlertModal from '$ui/Modals/ConfirmationAlertModal.svelte';
	import Toast from '$ui/Toast.svelte';

	import { __userSettings, __websiteOnline, __currentPage, __chapterNumber, __settingsDrawerHidden, __wakeLockEnabled, __fontType, __wordTranslation, __mushafMinimalModeEnabled, __topNavbarVisible, __bottomToolbarVisible, __displayType, __wideWesbiteLayoutEnabled, __signLanguageModeEnabled, __wordTransliterationEnabled } from '$utils/stores';
	import { debounce } from '$utils/debounce';
	import { toggleNavbar } from '$utils/toggleNavbar';
	import { resetAudioSettings } from '$utils/audioController';
	import { updateSettings } from '$utils/updateSettings';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { getWebsiteWidth } from '$utils/getWebsiteWidth';
	import { checkAndRegisterServiceWorker } from '$utils/serviceWorker';

	const defaultPaddingTop = 'pt-16';
	const defaultPaddingBottom = 'pb-8';
	let wakeLock = null;

	// Variables for custom padding depending on page
	let paddingTop = 0;
	let paddingBottom = 0;
	let paddingX = 0;

	setDefaultPaddings();

	// Update body scroll based on settings drawer visibility
	$: document.body.classList.toggle('overflow-y-hidden', !$__settingsDrawerHidden);

	// Stop all audio when the page or chapter changes
	$: if ($__currentPage || $__chapterNumber) {
		resetAudioSettings({ location: 'end' });
	}

	// Toggle distraction-free mushaf mode
	$: if ($__mushafMinimalModeEnabled && $__currentPage === 'mushaf') {
		paddingTop = 'pt-0';
		paddingBottom = 'pb-0';
		__topNavbarVisible.set(false);
		__bottomToolbarVisible.set(false);
	} else {
		setDefaultPaddings();
		__topNavbarVisible.set(true);
		__bottomToolbarVisible.set(true);
	}

	// Enable or disable wakeLock based on setting
	$: (async function () {
		if ($__wakeLockEnabled) {
			if (!wakeLock) {
				try {
					wakeLock = await navigator.wakeLock.request('screen');
					console.log('Wake lock enabled');
				} catch (error) {
					console.warn(error);
				}
			}
		} else {
			if (wakeLock) {
				await wakeLock.release();
				wakeLock = null;
				console.log('Wake lock disabled');
			}
		}
	})();

	// If wbw language was set to Russian or Ingush, switch back to English
	$: if ([9, 10].includes($__wordTranslation)) {
		updateSettings({ type: 'wordTranslation', value: 1 });
	}

	// Set default paddings based on current page
	function setDefaultPaddings() {
		// paddingTop = $__currentPage === 'home' ? 'pt-16' : defaultPaddingTop;
		paddingTop = $__currentPage === 'home' ? 'pt-0' : defaultPaddingTop;
		paddingBottom = $__currentPage === 'chapter' ? 'pb-24' : defaultPaddingBottom;
		paddingX = $__currentPage === 'mushaf' ? 'px-0 md:px-4' : $__currentPage === 'home' ? 'px-0' : 'px-4';
	}

	// Toggle bottom nav on scroll
	document.body.onscroll = () => {
		debounce(toggleNavbar, 0);
	};

	// Update online status
	window.addEventListener('online', () => {
		__websiteOnline.set(true);
	});

	// Update offline status
	window.addEventListener('offline', () => {
		__websiteOnline.set(false);
	});

	// Mushaf Page Handling
	$: if ($__currentPage === 'mushaf') {
		// Mushaf page always uses display type 6
		$__displayType = 6;

		// Mushaf page only supports font type 2
		if (![2, 3].includes($__fontType)) {
			__fontType.set(2);
		}
	}

	// Non-Mushaf Page Base Handling
	$: if ($__currentPage && $__currentPage !== 'mushaf') {
		const userSettings = JSON.parse(localStorage.getItem('userSettings'));
		const parsedUserSettings = JSON.parse($__userSettings);

		// Only restore user settings if sign language mode is OFF
		if (!$__signLanguageModeEnabled) {
			if (userSettings.displaySettings && parsedUserSettings.displaySettings) {
				$__displayType = userSettings.displaySettings.displayType;
				$__fontType = parsedUserSettings.displaySettings.fontType;
				$__wordTranslation = parsedUserSettings.translations?.word;
				$__wordTransliterationEnabled = parsedUserSettings.displaySettings.wordTransliterationEnabled;
			}
		}
	}

	// Sign Language Mode Handling (Non-Mushaf only)
	$: if ($__currentPage && $__currentPage !== 'mushaf' && $__signLanguageModeEnabled) {
		$__wordTranslation = 22;
		$__fontType = 9;
		$__wordTransliterationEnabled = false;

		// Restrict to display type 1 or 3
		if (![1, 3].includes($__displayType)) {
			$__displayType = 1;
		}
	}

	// Function to check old bookmarks for v3 update
	(function checkOldBookmarks() {
		const oldBookmarks = localStorage.getItem('bookmarks');

		if (oldBookmarks) {
			const bookmarkList = oldBookmarks.slice(0, -1).split('|');

			bookmarkList.forEach((bookmark) => {
				updateSettings({ type: 'userBookmarks', key: bookmark, oldCheck: true, set: true });
			});

			// remove the old bookmarks from localStorage as they're no longer needed
			localStorage.removeItem('bookmarks');
		}
	})();

	// Function to track the website Git version in Umami analytics
	(function trackWebsiteVersion() {
		try {
			const currentVersion = __APP_VERSION__.split(' ')[0];
			const storageKey = 'websiteVersionData';

			// Get existing data or initialize
			const data = JSON.parse(localStorage.getItem(storageKey)) || {
				latestVersion: null,
				sentVersion: null
			};

			// Always update the latest version
			data.latestVersion = currentVersion;

			// Check if this version was already sent
			if (data.sentVersion !== currentVersion) {
				if (window.umami && typeof window.umami.track === 'function') {
					window.umami.track('Website Version', { version: currentVersion });
				}
				// Mark as sent
				data.sentVersion = currentVersion;
			}

			// Save back to localStorage
			localStorage.setItem(storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Error tracking website version:', error);
		}
	})();

	// Service Worker
	checkAndRegisterServiceWorker();
</script>

<div class={`${getWebsiteWidth($__wideWesbiteLayoutEnabled)} mx-auto ${paddingTop} ${paddingBottom} ${paddingX}`}>
	<QuranNavigationModal />
	<AudioModal />
	<TajweedRulesModal />
	<NotesModal />
	<TafsirModal />
	<SiteNavigationModal />
	<SettingsSelectorModal />
	<VerseTranslationModal />
	<MorphologyModal />
	<CopyShareVerseModal />
	<ConfirmationAlertModal />
	<Toast />

	{#key $page.url.pathname}
		<div in:fade={{ duration: 300 }}>
			<Navbar />
			<SettingsDrawer />
			<BottomToolbar />
			<slot />
		</div>
	{/key}
</div>
