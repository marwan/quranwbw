import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// ADAPTER: 'auto' | 'vercel' | 'node' (VPS / Docker)
const platform = process.env.ADAPTER || 'auto';

const adapterPackages = {
	auto: '@sveltejs/adapter-auto',
	vercel: '@sveltejs/adapter-vercel',
	node: '@sveltejs/adapter-node'
};

if (!adapterPackages[platform]) {
	throw new Error(`Unknown ADAPTER "${platform}". Use: ${Object.keys(adapterPackages).join(', ')}`);
}

// only the selected adapter gets loaded
const { default: adapter } = await import(adapterPackages[platform]);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
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
