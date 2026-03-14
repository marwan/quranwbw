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
	 * Shared logic to check whether a given clientX position is close enough
	 * to the thumb. If not, prevents the default behaviour (track jump).
	 */
	function blockIfNotOnThumb(el, clientX, e) {
		const thumbX = getThumbPosition(el);
		const threshold = 16; // px — tune this if drag initiation feels too fussy

		if (Math.abs(clientX - thumbX) > threshold) {
			// Click/touch was on the track, not the thumb — block the jump
			e.preventDefault();
		}
		// Click/touch was on/near the thumb — allow default drag behaviour to proceed
	}

	/**
	 * Intercepts mousedown (desktop) to prevent click-to-jump on the track.
	 */
	function onMouseDown(e) {
		blockIfNotOnThumb(e.currentTarget, e.clientX, e);
	}

	/**
	 * Intercepts touchstart (mobile) to prevent tap-to-jump on the track.
	 * Uses the first touch point's clientX.
	 */
	function onTouchStart(e) {
		blockIfNotOnThumb(e.currentTarget, e.touches[0].clientX, e);
	}
</script>

<!-- 
	Range input with drag-only interaction.
	Clicking/tapping the track is disabled; only dragging the thumb changes the value.
-->
<input type="range" bind:value {...$$restProps} class={inputClass} on:mousedown={onMouseDown} on:touchstart={onTouchStart} on:change on:click on:keydown on:keypress on:keyup />
