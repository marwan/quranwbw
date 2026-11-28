import { sineIn } from 'svelte/easing';
import { getTailwindBreakpoint } from '$utils/getTailwindBreakpoint';

const duration = 150;

// Returns the modal transition config for the given type; slide transitions only apply on small screens
export function getModalTransition(type) {
	const breakpoint = getTailwindBreakpoint();

	const transitions = {
		basic: { duration, easing: sineIn },
		top: { y: -320, duration, easing: sineIn },
		bottom: { y: 320, duration, easing: sineIn },
		default: { duration, easing: sineIn }
	};

	if (type === 'basic') {
		return transitions.basic;
	}

	if (['default', 'sm'].includes(breakpoint)) {
		return transitions[type] || transitions.default;
	}

	return transitions.default;
}
