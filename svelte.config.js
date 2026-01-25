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
			$src: path.resolve('./src'),
			$utils: path.resolve('./src/utils'),
			$views: path.resolve('./src/views'),
			$data: path.resolve('./src/data'),
			$lib: path.resolve('./src/lib'),
			$ui: path.resolve('./src/components/ui'),
			$svgs: path.resolve('./src/components/svgs'),
			$display: path.resolve('./src/components/display'),
			$misc: path.resolve('./src/components/misc')
		},
		output: {
			bundleStrategy: 'single'
		},
		serviceWorker: {
			register: true
		}
	},
	preprocess: vitePreprocess()
};

export default config;
