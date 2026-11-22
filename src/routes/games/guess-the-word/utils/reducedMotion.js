import { readable } from 'svelte/store';

// True while the system is set to "reduce motion". It updates live if the setting changes,
// and stays false on the server, where there is no window.
// Use it in a component as $reducedMotion.
export const reducedMotion = readable(false, (set) => {
	if (typeof window === 'undefined') return;
	const query = window.matchMedia('(prefers-reduced-motion: reduce)');
	const update = () => set(query.matches);
	update();
	query.addEventListener('change', update);
	return () => query.removeEventListener('change', update);
});
