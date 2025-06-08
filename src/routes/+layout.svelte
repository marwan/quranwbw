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
	// import ChangelogModal from '$ui/Modals/ChangelogModal.svelte';
	import VerseTranslationModal from '$ui/Modals/VerseTranslationModal.svelte';
	import MorphologyModal from '$ui/Modals/MorphologyModal.svelte';
	import CopyShareVerseModal from '$ui/Modals/CopyShareVerseModal.svelte';
	import DownloadModal from '$ui/Modals/DownloadModal.svelte';

	import { __websiteOnline, __currentPage, __chapterNumber, __settingsDrawerHidden, __wakeLockEnabled, __userToken, __fontType, __wordTranslation, __verseTranslations, __mushafMinimalModeEnabled, __topNavbarVisible, __bottomToolbarVisible, __displayType } from '$utils/stores';
	import { checkOldBookmarks } from '$utils/checkOldBookmarks';
	import { debounce } from '$utils/debounce';
	import { toggleNavbar } from '$utils/toggleNavbar';
	import { resetAudioSettings } from '$utils/audioController';
	import { updateSettings } from '$utils/updateSettings';
	import { checkAndRegisterServiceWorker } from '$utils/serviceWorker';

	// Function to check old bookmarks for v3 update
	checkOldBookmarks();

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

	// Update settings from cloud when chapter or page changes
	// $: if ($__currentPage && $__chapterNumber) {
	// 	downloadSettingsFromCloud();
	// }

	// Reset chapter data loaded when certain settings update
	$: if ($__currentPage || $__fontType || $__wordTranslation || $__verseTranslations) {
		localStorage.setItem('chapterDataLoaded', false);
	}

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
				} catch (err) {
					console.error(err);
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

	// Update display and font type based on current page
	$: if ($__currentPage === 'mushaf') {
		$__displayType = 6;
		// We do not need Uthmani digital and Indopak fonts in mushaf page
		if (![2, 3].includes($__fontType)) {
			__fontType.set(2);
		}
	} else {
		const userSettings = JSON.parse(localStorage.getItem('userSettings'));
		updateSettings({ type: 'displayType', value: userSettings.displaySettings.displayType, skipTrackEvent: true });
	}

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

	// Service Worker
	// checkAndRegisterServiceWorker();
</script>

<div class="max-w-screen-lg mx-auto {paddingTop} {paddingBottom} {paddingX}">
	<Navbar />
	<SettingsDrawer />
	<QuranNavigationModal />
	<!-- <InitialSetupModal /> -->
	<AudioModal />
	<TajweedRulesModal />
	<NotesModal />
	<!-- <TokenModal /> -->
	<!-- <DownloadModal /> -->
	<TafsirModal />
	<SiteNavigationModal />
	<SettingsSelectorModal />
	<!-- <LexiconModal /> -->
	<!-- <ChangelogModal /> -->
	<VerseTranslationModal />
	<MorphologyModal />
	<CopyShareVerseModal />
	<BottomToolbar />
	<slot />
</div>
