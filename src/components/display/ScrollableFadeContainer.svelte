<!--
	A scrollable container that shows a fade effect at the bottom to hint at overflow content.
	The fade gradually disappears as the user scrolls down, and is fully gone at the bottom.
	Also supports an optional callback for custom actions on scroll.
-->
<script>
	import { onMount } from 'svelte';

	export let containerId;
	export let maxHeight = 250; // max height of the scrollable area in pixels
	export let fadeHeight = 50; // height of the fade effect in pixels
	export let onScrollAction = () => {}; // optional callback when user scrolls

	let container;
	let fadePixels = fadeHeight; // tracks the current fade size, shrinks as user scrolls down

	onMount(() => {
		if (!container) return;

		// Re-evaluate the fade whenever the container's content resizes
		// (e.g. items added/removed dynamically)
		const resizeObserver = new ResizeObserver(() => {
			updateFade();
		});

		resizeObserver.observe(container);

		// Set initial fade state on mount
		updateFade();

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Calculates how many pixels of fade to show based on scroll position.
	// Full fade at the top, no fade when scrolled to the very bottom.
	function updateFade() {
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const maxScroll = scrollHeight - clientHeight;

		// No scrollable content, so no fade needed
		if (maxScroll <= 0) {
			fadePixels = 0;
			return;
		}

		// scrollProgress goes from 0 (top) to 1 (bottom)
		const scrollProgress = scrollTop / maxScroll;

		// Fade shrinks linearly as user scrolls down, reaching 0 at the very bottom
		fadePixels = Math.max(0, Math.min(fadeHeight, fadeHeight * (1 - scrollProgress)));
	}

	function handleScroll() {
		updateFade();
		onScrollAction();
	}
</script>

<div class="relative">
	<div
		id={containerId}
		bind:this={container}
		on:scroll={handleScroll}
		class="flex flex-col space-y-4 overflow-y-scroll no-scrollbar-scroll-container"
		style="
			max-height: {maxHeight}px;
			/* Fade mask: fully visible at top, fades out over the last {fadePixels}px at the bottom */
			mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%);
			-webkit-mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%);
		"
	>
		<slot />
	</div>
</div>
