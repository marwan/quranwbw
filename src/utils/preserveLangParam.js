import { beforeNavigate } from '$app/navigation';
import { browser } from '$app/environment';

/**
 * Preserves the ?lang= parameter across navigation for debugging purposes
 * Call this in +layout.svelte to apply globally
 */
export function preserveLangParam() {
	if (!browser) return;

	beforeNavigate(({ to, from }) => {
		if (!to || !from) return;

		const fromParams = new URLSearchParams(from.url.search);
		const langParam = fromParams.get('lang');

		if (langParam && to.url) {
			const toParams = new URLSearchParams(to.url.search);
			
			// Only add if not already present
			if (!toParams.has('lang')) {
				toParams.set('lang', langParam);
				to.url.search = toParams.toString();
			}
		}
	});
}
