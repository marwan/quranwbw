<script>
	export let chapter = 1;

	import { chapterHeaderCodes } from '$data/quranMeta';
	import { chapterHeaderFontMap } from '$data/websiteSettings';
	import { loadFont } from '$utils/loadFont';
	import { __currentPage } from '$utils/stores';
	import { onMount } from 'svelte';

	// The active font family name to apply, reactive so the template updates when it changes
	let activeFontFamily = 'chapter-header-regular';

	// Picks the correct font family name based on the current page and viewport width.
	// On mushaf page we always use regular; on other pages we match the breakpoint.
	function resolveActiveFontFamily() {
		if ($__currentPage === 'mushaf') {
			// Mushaf page always uses the regular (narrow) variant
			return 'chapter-header-regular';
		}

		// md breakpoint = 768px, lg breakpoint = 1024px (matches Tailwind defaults)
		if (window.matchMedia('(min-width: 1024px)').matches) {
			// Large screens get the ultra-wide variant for the fullest header display
			return 'chapter-header-ultrawide';
		} else if (window.matchMedia('(min-width: 768px)').matches) {
			// Medium screens get the wide variant
			return 'chapter-header-wide';
		} else {
			// Small screens get the regular (narrowest) variant
			return 'chapter-header-regular';
		}
	}

	// Shows all header elements by removing the 'invisible' guard class.
	// Called once all required fonts have finished loading.
	function revealHeaders() {
		document.querySelectorAll('.header').forEach((el) => el.classList.remove('invisible'));
	}

	onMount(() => {
		// Load all three font variants under distinct family names so the browser
		// has them cached and can switch instantly when the breakpoint changes.
		const fontLoads = [loadFont('chapter-header-regular', chapterHeaderFontMap.regular), loadFont('chapter-header-wide', chapterHeaderFontMap.wide), loadFont('chapter-header-ultrawide', chapterHeaderFontMap.ultraWide)];

		// Once every font is ready, resolve the active variant and reveal the headers
		Promise.all(fontLoads).then(() => {
			activeFontFamily = resolveActiveFontFamily();
			revealHeaders();
		});

		// Re-evaluate the active font family whenever the viewport is resized
		// so switching between breakpoints updates the displayed header font live
		const onResize = () => {
			activeFontFamily = resolveActiveFontFamily();
		};
		window.addEventListener('resize', onResize);

		// Clean up the resize listener when the component is destroyed
		return () => window.removeEventListener('resize', onResize);
	});
</script>

{#if $__currentPage === 'mushaf'}
	<!-- Mushaf layout: left-aligned, larger vertical padding, no explicit text-align -->
	<div style="font-family: {activeFontFamily}; line-height: 0;" class="header invisible pt-4 md:pt-8 pb-6 text-[28vw] md:text-[195px] lg:text-[195px]">
		{chapterHeaderCodes[chapter]}
	</div>
{:else}
	<!-- Default layout: centred, zero line-height to tighten the decorative glyph,
	     wider bottom padding to give breathing room below the header -->
	<div style="font-family: {activeFontFamily}; line-height: 0;" class="header invisible pt-4 md:pt-8 pb-10 text-[26vw] md:text-[290px] lg:text-[300px] text-center">
		{chapterHeaderCodes[chapter]}
	</div>
{/if}
