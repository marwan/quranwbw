// during `vite build` every +page.svelte under src/routes/dev/ is replaced with an empty file,
// so the page code and everything only it imports never reaches the bundle
export const excludeDevRoutes = () => ({
	name: 'exclude-dev-routes',
	enforce: 'pre',
	apply: 'build',
	load(id) {
		if (/[\\/]src[\\/]routes[\\/]dev[\\/].*\+page\.svelte$/.test(id.split('?')[0])) return '';
	}
});
