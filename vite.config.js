import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { config } from 'dotenv';

config();

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
	} catch (e) {
		return 'unknown';
	}
}

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(getVersion())
	},
	build: {
		sourcemap: false
	}
});
