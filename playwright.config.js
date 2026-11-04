import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const isCI = !!process.env.CI;

// Visual regression tests for the Mushaf pages.
// Baselines live in tests/e2e/__screenshots__ and are generated on Linux in CI
// (inside the official Playwright Docker image) so font rendering is deterministic.
export default defineConfig({
	testDir: './tests/e2e',
	// No platform suffix: baselines are only ever produced in CI (Linux)
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	workers: isCI ? 4 : undefined,
	timeout: 30_000,
	reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
	expect: {
		timeout: 10_000,
		toHaveScreenshot: {
			threshold: 0.2,
			maxDiffPixelRatio: 0.001,
			animations: 'disabled',
			caret: 'hide',
			scale: 'css',
			stylePath: './tests/e2e/screenshot.css'
		}
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				baseURL: BASE_URL,
				// Tall viewport so a full Mushaf page fits without scrolling
				viewport: { width: 1280, height: 1600 },
				deviceScaleFactor: 1,
				colorScheme: 'light',
				locale: 'en-US',
				timezoneId: 'UTC',
				serviceWorkers: 'block',
				trace: 'retain-on-failure',
				screenshot: 'only-on-failure'
			}
		}
	],
	webServer: {
		command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
		url: BASE_URL,
		reuseExistingServer: !isCI,
		timeout: 180_000,
		stdout: 'ignore',
		stderr: 'pipe'
	}
});
