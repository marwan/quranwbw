<script>
	import { twMerge } from 'tailwind-merge';
	export let value;
	export let size = 'md';
	const sizes = {
		sm: 'h-1 range-sm',
		md: 'h-2',
		lg: 'h-3 range-lg'
	};
	let inputClass;
	$: inputClass = twMerge('w-full rounded-lg appearance-none cursor-pointer', sizes[size] ?? sizes.md, $$props.class);

	/**
	 * Calculates the pixel X position of the slider thumb on screen.
	 * Browsers don't expose the thumb position directly, so we derive it
	 * from the current value, min/max range, and the element's bounding rect.
	 * A small thumbOffset is subtracted from each side to account for the
	 * thumb not reaching the very edges of the track.
	 */
	function getThumbPosition(el) {
		const min = Number(el.min) || 0;
		const max = Number(el.max) || 100;
		const ratio = (value - min) / (max - min);
		const rect = el.getBoundingClientRect();
		const thumbOffset = 10; // approximate half-width of the thumb in px
		return rect.left + thumbOffset + ratio * (rect.width - 2 * thumbOffset);
	}

	/**
	 * Intercepts mousedown on the range input to prevent the browser's default
	 * "click-to-jump" behaviour, where clicking anywhere on the track instantly
	 * moves the thumb to that position.
	 *
	 * Instead, we only allow the interaction if the click landed within a small
	 * threshold radius around the current thumb position — i.e. the user must
	 * click directly on the thumb to drag it.
	 */
	function onMouseDown(e) {
		const thumbX = getThumbPosition(e.currentTarget);
		const clickX = e.clientX;
		const threshold = 16; // px — tune this if drag initiation feels too fussy

		if (Math.abs(clickX - thumbX) > threshold) {
			// Click was on the track, not the thumb — block the jump
			e.preventDefault();
		}
		// Click was on/near the thumb — allow default drag behaviour to proceed
	}
</script>

<!-- 
	Range input with drag-only interaction.
	Clicking the track is disabled; only dragging the thumb changes the value.
-->
<input type="range" bind:value {...$$restProps} class={inputClass} on:mousedown={onMouseDown} on:change on:click on:keydown on:keypress on:keyup />
