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

	// Holds the value at the moment a touch begins, used to revert if the tap wasn't on the thumb
	let snapshotValue = value;

	// True only when the touch/click originated on the thumb, not the track
	let thumbEngaged = false;

	/**
	 * Derives the thumb's current pixel X position on screen.
	 * Browsers don't expose this directly, so we calculate it from the
	 * current value, the min/max range, and the element's bounding rect.
	 * thumbOffset accounts for the thumb not reaching the very edges of the track.
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
	 * Returns true if the given clientX is within 16px of the thumb center.
	 * The 16px threshold gives enough tolerance for finger-sized touches.
	 */
	function isOnThumb(el, clientX) {
		return Math.abs(clientX - getThumbPosition(el)) <= 16;
	}

	/**
	 * On desktop, prevent click-to-jump by blocking mousedown events
	 * that didn't originate on the thumb.
	 */
	function onMouseDown(e) {
		thumbEngaged = isOnThumb(e.currentTarget, e.clientX);
		if (!thumbEngaged) e.preventDefault();
	}

	/**
	 * On mobile, snapshot the current value before the browser has a chance
	 * to process the touch and potentially jump the thumb to the tapped location.
	 */
	function onTouchStart(e) {
		snapshotValue = value;
		thumbEngaged = isOnThumb(e.currentTarget, e.touches[0].clientX);
	}

	/**
	 * On touch end, if the touch didn't start on the thumb, restore the
	 * snapshotted value to undo any jump the browser may have applied.
	 * This is the core of the fix — we can't always prevent the browser
	 * from jumping, so we correct it after the fact instead.
	 */
	function onTouchEnd() {
		if (!thumbEngaged) value = snapshotValue;
		thumbEngaged = false;
	}
</script>

<input type="range" bind:value {...$$restProps} class={inputClass} on:mousedown={onMouseDown} on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:change on:click on:keydown on:keypress on:keyup />
