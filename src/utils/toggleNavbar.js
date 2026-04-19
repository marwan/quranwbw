import { get } from 'svelte/store';
import { __currentPage, __topNavbarVisible, __bottomToolbarVisible, __audioSettings } from '$utils/stores';

// Threshold (px) before navbars hide when scrolling down
const scrollHideThreshold = 100;

// Buffer (px) from the bottom of the page to still count as "at the bottom"
const bottomOfPageBuffer = 100;

// Pages where scroll-based navbar hiding is active
const scrollAwarePages = ['chapter', 'juz', 'hizb'];

// Pages where the top navbar should always remain visible (never hidden)
const alwaysShowTopNavbarPages = ['juz', 'hizb'];

// Tracks the scroll position from the previous rAF tick
let prevScrollPos = 0;

// Prevents multiple rAF calls from stacking up on rapid scroll events
let ticking = false;

// Main entry point — call this on every scroll event.
// Decides how to respond based on the current page.
export function toggleNavbar() {
	const currentPage = get(__currentPage);

	if (scrollAwarePages.includes(currentPage)) {
		// These pages hide/show navbars depending on scroll direction
		handleScroll();
	} else if (currentPage !== 'mushaf') {
		// All other pages (except mushaf, which manages its own UI) always show navbars
		showNavbars();
	}
}

// Throttles scroll handling to one update per animation frame.
// Reads scroll position fresh inside the rAF callback to avoid stale values.
function handleScroll() {
	if (ticking) return;

	window.requestAnimationFrame(() => {
		const currentScrollPos = getCurrentScroll();

		// Do nothing if the scroll position hasn't changed — this prevents
		// the final rAF tick after the user stops scrolling from triggering a hide
		if (currentScrollPos === prevScrollPos) {
			ticking = false;
			return;
		}

		if (isScrollingUp(currentScrollPos) || isBottomOfPage()) {
			showNavbars();
		} else {
			hideNavbars();
		}

		prevScrollPos = currentScrollPos;
		ticking = false;
	});

	ticking = true;
}

// Returns true if the user is scrolling up.
function isScrollingUp(currentScrollPos) {
	return prevScrollPos > currentScrollPos;
}

// Returns true if the user has scrolled near the bottom of the page.
// Navbars are shown near the bottom regardless of scroll direction since
// there is nowhere left to scroll and the content is fully visible.
function isBottomOfPage() {
	return window.innerHeight + window.scrollY >= document.body.scrollHeight - bottomOfPageBuffer;
}

// Unconditionally shows both the top navbar and bottom toolbar.
function showNavbars() {
	__topNavbarVisible.set(true);
	__bottomToolbarVisible.set(true);
}

// Hides the top navbar and/or bottom toolbar based on the current page,
// but only once the user has scrolled past the hide threshold.
//
// Rules:
// - On juz/hizb pages, the top navbar always stays visible.
// - On chapter pages, both bars are hidden when scrolling down.
// - The bottom toolbar stays visible if verse audio is actively playing.
function hideNavbars() {
	// Only start hiding after the user has scrolled past the threshold
	if (window.scrollY <= scrollHideThreshold) return;

	const currentPage = get(__currentPage);
	const { isPlaying, audioType } = get(__audioSettings);

	// On juz/hizb pages, keep the top navbar visible — only hide the bottom toolbar
	const shouldShowTopNavbar = alwaysShowTopNavbarPages.includes(currentPage);

	// Keep the bottom toolbar visible if verse audio is actively playing
	const shouldShowBottomToolbar = isPlaying && audioType === 'verse';

	__topNavbarVisible.set(shouldShowTopNavbar);
	__bottomToolbarVisible.set(shouldShowBottomToolbar);
}

// Returns the current vertical scroll position.
// Uses documentElement.scrollTop (pageYOffset is deprecated).
function getCurrentScroll() {
	return document.documentElement.scrollTop;
}
