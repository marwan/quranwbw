<script>
	import { onMount } from 'svelte';

	export let containerId;
	export let maxHeight = 250;
	export let fadeHeight = 50;
	export let onScrollAction = () => {};

	let container;
	let fadePixels = fadeHeight;

	onMount(() => {
		if (!container) return;

		const resizeObserver = new ResizeObserver(() => {
			updateFade();
		});

		resizeObserver.observe(container);
		updateFade();

		return () => {
			resizeObserver.disconnect();
		};
	});

	function updateFade() {
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const maxScroll = scrollHeight - clientHeight;

		if (maxScroll <= 0) {
			fadePixels = 0;
			return;
		}

		const scrollProgress = scrollTop / maxScroll;
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
		style="max-height: {maxHeight}px; mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0, black calc(100% - {fadePixels}px), transparent 100%);"
	>
		<slot />
	</div>
</div>
