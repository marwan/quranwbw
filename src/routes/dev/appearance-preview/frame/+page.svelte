<script>
	import { onMount, onDestroy } from 'svelte';
	import { __websiteTheme, __fontType, __displayType, __currentPage, __wordTranslationEnabled, __wordTransliterationEnabled } from '$utils/stores';

	// ---------------------------------------------------------------------------
	// This page renders ONE theme using the real site components.
	// It is loaded inside an iframe by ../+page.svelte, so the stores below are a separate copy
	// from the parent window and changing them never touches the real app.
	// ---------------------------------------------------------------------------

	// finds FullVersesDisplay wherever it lives in src, so moving the file does not break this page
	const fullVersesDisplayModules = import.meta.glob('/src/**/FullVersesDisplay.svelte', { eager: true });
	const FullVersesDisplay = Object.values(fullVersesDisplayModules)[0]?.default;

	// settings sent by the parent page
	const queryParameters = new URLSearchParams(window.location.search);
	const themeId = Number(queryParameters.get('theme'));
	const fontType = Number(queryParameters.get('fontType'));
	const displayType = Number(queryParameters.get('displayType'));
	const verseKey = queryParameters.get('verseKey') || '2:1';
	const showWordTranslations = queryParameters.get('showWordTranslations') === '1';

	// the real app saves settings to localStorage when they change (reading position, etc.)
	// block that for this iframe, otherwise previewing would overwrite the user's saved settings
	const originalSetItem = Storage.prototype.setItem;
	Storage.prototype.setItem = function (key, value) {
		if (key === 'userSettings') return;
		return originalSetItem.call(this, key, value);
	};

	// puts the original localStorage behavior back when leaving the page
	onDestroy(() => (Storage.prototype.setItem = originalSetItem));

	// the theme class on <html> decides which CSS variables, palettes and bismillah colors apply
	// (app.html already added the user's own theme, so remove it first)
	[...document.documentElement.classList].forEach((className) => {
		if (/^theme-\d+$/.test(className)) document.documentElement.classList.remove(className);
	});
	document.documentElement.classList.add(`theme-${themeId}`);

	// the components read these stores, so set them before anything renders
	__websiteTheme.set(themeId);
	__fontType.set(fontType);
	__displayType.set(displayType);
	__wordTranslationEnabled.set(showWordTranslations);
	__wordTransliterationEnabled.set(showWordTranslations);

	// on 'juz' / 'hizb' pages the real component shows the chapter header and bismillah before verse 1 of a chapter
	__currentPage.set('juz');

	// ---------------------------------------------------------------------------
	// Report the content height to the parent so the iframe has no inner scrollbar
	// ---------------------------------------------------------------------------

	let contentElement;

	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			window.parent.postMessage({ type: 'appearance-preview-height', themeId, height: contentElement.offsetHeight }, window.location.origin);
		});

		resizeObserver.observe(contentElement);

		return () => resizeObserver.disconnect();
	});
</script>

<!-- the root layout still renders (navbar, toolbars, etc.), so this fixed container covers all of it -->
<div class="fixed inset-0 z-[9999] overflow-auto bg-theme-bg text-theme-text">
	<div bind:this={contentElement} class="p-4">
		{#if FullVersesDisplay}
			<!-- same component the real chapter / juz pages use -->
			<svelte:component this={FullVersesDisplay} keys={verseKey} startIndex={0} endIndex={0} />
		{:else}
			<div class="text-red-600">FullVersesDisplay.svelte was not found in src</div>
		{/if}
	</div>
</div>
