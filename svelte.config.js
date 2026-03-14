import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

const useNodeAdapter = process.env.USE_NODE_ADAPTER === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Use Node adapter when explicitly enabled (VPS / Docker / Dokploy / any Node server).
		// Defaults to adapter-auto for platforms like Cloudflare Pages, Vercel, etc.
		adapter: useNodeAdapter ? adapterNode() : adapterAuto(),
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
