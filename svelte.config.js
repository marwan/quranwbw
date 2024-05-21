import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$ui: path.resolve('./src/components/ui'),
			$modals: path.resolve('./src/components/ui/modals'),
			$components: path.resolve('./src/components'),
			$verses: path.resolve('./src/components/verses'),
			$displays: path.resolve('./src/components/verses/displays'),
			$svgs: path.resolve('./src/components/svgs'),
			$utils: path.resolve('./src/utils'),
			$views: path.resolve('./src/views'),
			$data: path.resolve('./src/data'),
			$lib: path.resolve('./src/lib'),
			$morphology: path.resolve('./src/components/morphology'),
			$flowbiteSvelte: path.resolve('./src/components/ui/flowbite-svelte')
		}
	},
	preprocess: vitePreprocess()
};

export default config;