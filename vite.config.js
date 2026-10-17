import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { config } from 'dotenv';

config();

// when EXCLUDE_DEV_ROUTES=true is set at build time, the /dev routes are stripped from the bundle
const excludeDevRoutesFromBuild = process.env.EXCLUDE_DEV_ROUTES === 'true';

// during `vite build` every +page.svelte under src/routes/dev/ is replaced with an empty file,
// so the page code and everything only it imports never reaches the bundle
const excludeDevRoutes = () => ({
	name: 'exclude-dev-routes',
	enforce: 'pre',
	apply: 'build',
	load(id) {
		if (/[\\/]src[\\/]routes[\\/]dev[\\/].*\+page\.svelte$/.test(id.split('?')[0])) return '';
	}
});

function getVersion() {
	try {
		const commit = execSync('git rev-parse --short HEAD').toString().trim();

		const date = new Date();
		const istFormatter = new Intl.DateTimeFormat('en-GB', {
			timeZone: 'Asia/Kolkata',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});

		const parts = istFormatter.formatToParts(date).reduce((acc, part) => {
			if (part.type !== 'literal') acc[part.type] = part.value;
			return acc;
		}, {});

		const formatted = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
		return `${commit} (${formatted})`;
	} catch {
		return 'unknown';
	}
}

export default defineConfig({
	// the exclusion plugin must come before sveltekit()
	plugins: [...(excludeDevRoutesFromBuild ? [excludeDevRoutes()] : []), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(getVersion())
	},
	build: {
		sourcemap: false
	}
});
