// https://www.geeksforgeeks.org/how-to-get-tailwind-css-active-breakpoint-in-javascript/
// Returns the name of the currently active Tailwind breakpoint based on the window width
export function getTailwindBreakpoint() {
	if (window.matchMedia('(min-width: 1280px)').matches) return 'xl';
	else if (window.matchMedia('(min-width: 1024px)').matches) return 'lg';
	else if (window.matchMedia('(min-width: 768px)').matches) return 'md';
	else if (window.matchMedia('(min-width: 640px)').matches) return 'sm';
	else return 'default';
}
