<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';

	// QuranWBW User Settings API
	const apiBase = 'https://cloud-backup-api.quranwbw.com/user';

	// The localStorage key where settings are stored
	const settingsKey = 'userSettings';

	// The localStorage key where we persist the user's token locally
	// so they don't have to re-enter it every session
	const tokenStorageKey = 'cloudBackupAndRestoreToken';

	// Settings paths that should NEVER be overwritten during a restore.
	// Each entry is a dot-separated path into the userSettings object.
	// Add or remove paths here as needed.
	const settingsRestoreExclusions = [
		'displaySettings.fontSizes',
		'offlineModeSettings',

		// Some audio settings
		'audioSettings.playBoth',
		'audioSettings.playingKey',
		'audioSettings.playingWordKey',
		'audioSettings.isPlaying',
		'audioSettings.startVerse',
		'audioSettings.endVerse'
	];

	const networkErrorMessage = 'Network error. Please check your connection and try again.';

	// The token currently saved in localStorage (auto-populated on mount)
	let savedToken = localStorage.getItem(tokenStorageKey) || '';

	// Input field for entering an existing token from another device
	let tokenInput = '';

	// Indicates whether the current token input is valid based on all client-side validation rules
	let isTokenValid = false;

	// Controls which "panel" is shown: 'main' | 'generate' | 'enter'
	let view = 'main';

	// Loading states for each async action
	let isGenerating = false;
	let isValidating = false;
	let isBackingUp = false;
	let isRestoring = false;

	// Metadata about the cloud backup (returned on restore-preview or backup success)
	let backupMeta = null; // { backed_up_at, checksum }

	// Restore preview data — shown before applying to localStorage
	let restorePreview = null; // { settings, checksum, backed_up_at }

	// Copy button state for active token
	let hasCopiedToken = false;
	let copyResetTimer;

	// True if any async operation is in progress
	$: isBusy = isGenerating || isValidating || isBackingUp || isRestoring;

	// Format an ISO date string into a human-readable local time.
	// new Date().toLocaleString(undefined, ...) automatically uses the
	// browser's local timezone — no location permission needed.
	function formatDate(isoString) {
		if (!isoString) return 'Unknown';
		return new Date(isoString).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	// Persist the token to localStorage so the user doesn't have to re-enter it
	function persistToken(token) {
		localStorage.setItem(tokenStorageKey, token);
		savedToken = token;
	}

	// Remove the locally stored token (does NOT delete cloud data)
	function forgetLocalToken() {
		localStorage.removeItem(tokenStorageKey);
		savedToken = '';
		restorePreview = null;
		backupMeta = null;
		view = 'main';
	}

	// Read the current settings from localStorage
	function readLocalSettings() {
		try {
			const raw = localStorage.getItem(settingsKey);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	// Apply restored settings to localStorage and trigger a page reload
	// so all stores pick up the new values
	function applyRestoredSettings(settings) {
		localStorage.setItem(settingsKey, JSON.stringify(settings));
		// Reload so all Svelte stores re-initialise from localStorage
		window.location.reload();
	}

	// Verify a checksum on the client side before applying restored settings.
	// We re-hash the received object using the Web Crypto API and compare
	// it against the checksum returned by the server.
	// async function verifyChecksum(settingsObj, expectedChecksum) {
	// 	try {
	// 		const str = JSON.stringify(settingsObj);
	// 		const encoded = new TextEncoder().encode(str);
	// 		const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	// 		const hashArray = Array.from(new Uint8Array(hashBuffer));
	// 		const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	// 		return hashHex === expectedChecksum;
	// 	} catch {
	// 		// If Web Crypto isn't available, skip verification (fail open)
	// 		return true;
	// 	}
	// }

	// Generic fetch wrapper that adds the user-token header.
	// Returns { ok, status, json } — callers should branch on status, not json.message.
	async function apiFetch(path, options = {}) {
		const headers = {
			'Content-Type': 'application/json',
			...(savedToken ? { 'user-token': savedToken } : {}),
			...(options.headers || {})
		};

		const response = await fetch(`${apiBase}${path}`, {
			...options,
			headers
		});

		// Parse JSON even on error responses, but we only use it for data fields —
		// never for message strings to display to users
		const json = await response.json().catch(() => ({ code: response.status }));
		return { ok: response.ok, status: response.status, json };
	}

	// Maps an HTTP status code to a user-facing error string.
	// All error messaging is defined here — never use server-returned message strings.
	// context is one of: 'generate' | 'validate' | 'backup' | 'restore'
	function getErrorForStatus(status, context) {
		switch (status) {
			case 400:
				if (context === 'validate') return 'That token is not valid. Please double-check and try again.';
				if (context === 'backup') return 'Could not save your settings. Please try again.';
				return 'Something went wrong. Please try again.';
			case 404:
				if (context === 'validate') return 'Token not found. Please double-check and try again.';
				if (context === 'restore') return 'No cloud backup found for this token. Back up your settings first.';
				return 'Not found. Please try again.';
			case 409:
				return 'A conflict occurred. Please refresh and try again.';
			case 413:
				return 'Your settings are too large to back up.';
			case 429:
				if (context === 'generate') return 'Token generation limit reached. Please try again later.';
				if (context === 'validate') return 'Too many validation attempts. Please try again later.';
				return 'Too many requests. Please slow down and try again later.';
			case 500:
			case 502:
			case 503:
				return 'Server error. Please try again in a few moments.';
			default:
				return 'An unexpected error occurred. Please check your connection and try again.';
		}
	}

	// Generate a brand-new anonymous token
	async function handleGenerateToken() {
		isGenerating = true;

		try {
			const { ok, status, json } = await apiFetch('/tokens/generate', { method: 'POST' });

			if (!ok) {
				showAlert(getErrorForStatus(status, 'generate'));
				return;
			}

			// Store the token locally immediately
			persistToken(json.token);
			view = 'generate';
		} catch {
			// Network-level failure (offline, DNS, CORS, etc.)
			showAlert(networkErrorMessage);
		} finally {
			isGenerating = false;
		}
	}

	// Validate a manually entered token from another device
	async function handleValidateToken() {
		const trimmed = tokenInput.trim();

		if (!trimmed) {
			showAlert('Please enter your token.');
			return;
		}

		isValidating = true;

		try {
			const { ok, status } = await apiFetch('/tokens/validate', {
				method: 'GET',
				headers: { 'user-token': trimmed }
			});

			if (!ok) {
				showAlert(getErrorForStatus(status, 'validate'));
				return;
			}

			// Token is valid — save it locally and show the main panel
			persistToken(trimmed);
			tokenInput = '';
			view = 'main';
		} catch {
			showAlert(networkErrorMessage);
		} finally {
			isValidating = false;
		}
	}

	// Backup current localStorage settings to the cloud
	async function handleBackup() {
		const settings = readLocalSettings();
		if (!settings) {
			showAlert('No local settings found to back up.');
			return;
		}

		isBackingUp = true;

		try {
			const { ok, status, json } = await apiFetch('/settings', {
				method: 'POST',
				body: JSON.stringify(settings)
			});

			if (!ok) {
				showAlert(getErrorForStatus(status, 'backup'));
				return;
			}

			// Store backup metadata locally for display in the UI
			backupMeta = json.meta;

			// Clear any open restore preview — its data is now stale after a fresh backup
			restorePreview = null;
		} catch {
			showAlert(networkErrorMessage);
		} finally {
			isBackingUp = false;
		}
	}

	// Fetch the cloud backup and show a preview before applying.
	// Always clears any existing preview and re-fetches fresh data on each click.
	async function handleRestorePreview() {
		// Clear any existing preview before fetching fresh data
		restorePreview = null;

		isRestoring = true;

		try {
			const { ok, status, json } = await apiFetch('/settings', { method: 'GET' });

			if (!ok) {
				showAlert(getErrorForStatus(status, 'restore'));
				return;
			}

			restorePreview = json.data;

			const changedSettings = getChangedSettings(readLocalSettings() || {}, restorePreview.settings);

			// Show an alert if there is no difference
			if (changedSettings.length === 0) {
				showAlert('Your local settings are already identical to this backup. No changes will be made.');
			}
		} catch {
			showAlert(networkErrorMessage);
		} finally {
			isRestoring = false;
		}
	}

	// Apply the previewed settings after user confirms.
	// Preserves settingsRestoreExclusions paths from the current local settings.
	async function handleRestoreConfirm() {
		if (!restorePreview) return;

		const currentSettings = readLocalSettings() || {};

		// Snapshot the values we must never overwrite
		const protectedValues = settingsRestoreExclusions.map((path) => ({
			path,
			value: getNestedValue(currentSettings, path)
		}));

		// Deep-clone the incoming settings so we can safely mutate it
		const merged = JSON.parse(JSON.stringify(restorePreview.settings));

		// Re-apply all protected values on top of the incoming settings
		for (const { path, value } of protectedValues) {
			if (value !== undefined) setNestedValue(merged, path, value);
		}

		applyRestoredSettings(merged);
	}

	// Cancel the restore preview
	function handleRestoreCancel() {
		restorePreview = null;
	}

	// Copies the active token to the clipboard and briefly shows "Copied" feedback.
	// Repeated clicks reset the timer so the feedback behaves correctly.
	function handleCopyToken() {
		if (!savedToken) return;

		navigator.clipboard?.writeText(savedToken);

		hasCopiedToken = true;

		// Handle repeated clicks safely
		clearTimeout(copyResetTimer);
		copyResetTimer = setTimeout(() => {
			hasCopiedToken = false;
		}, 2000);
	}

	// Reads a nested value from an object using a dot-separated path string
	// e.g. getNestedValue(obj, 'displaySettings.fontSizes') → obj.displaySettings.fontSizes
	function getNestedValue(obj, path) {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	// Sets a nested value in an object using a dot-separated path string (mutates the object)
	function setNestedValue(obj, path, value) {
		const keys = path.split('.');
		const lastKey = keys.pop();
		const target = keys.reduce((current, key) => {
			if (current[key] === undefined) current[key] = {};
			return current[key];
		}, obj);
		target[lastKey] = value;
	}

	// Deep equality check using JSON serialization (sufficient for settings comparison)
	function isEqual(a, b) {
		return JSON.stringify(a) === JSON.stringify(b);
	}

	// Returns a flat list of { path, currentValue, newValue } for every leaf-level
	// setting that differs between currentSettings and newSettings,
	// skipping anything under settingsRestoreExclusions paths.
	function getChangedSettings(currentSettings, newSettings, prefix = '', changes = []) {
		// Collect all keys from both objects
		const allKeys = new Set([...Object.keys(currentSettings || {}), ...Object.keys(newSettings || {})]);

		for (const key of allKeys) {
			const fullPath = prefix ? `${prefix}.${key}` : key;

			// Skip anything in the do-not-restore list
			if (settingsRestoreExclusions.some((blocked) => fullPath === blocked || fullPath.startsWith(blocked + '.'))) {
				continue;
			}

			const currentVal = currentSettings?.[key];
			const newVal = newSettings?.[key];

			// If both sides are plain objects, recurse into them
			if (currentVal !== null && newVal !== null && typeof currentVal === 'object' && !Array.isArray(currentVal) && typeof newVal === 'object' && !Array.isArray(newVal)) {
				getChangedSettings(currentVal, newVal, fullPath, changes);
			} else {
				// Leaf value — only record if it actually changed
				if (!isEqual(currentVal, newVal)) {
					changes.push({ path: fullPath, currentValue: currentVal, newValue: newVal });
				}
			}
		}

		return changes;
	}

	// Formats a raw setting value for display in the diff list
	function formatValue(val) {
		if (val === null || val === undefined) return '—';
		if (typeof val === 'boolean') return val ? 'Yes' : 'No';
		if (Array.isArray(val)) return val.length ? val.join(', ') : '(empty)';
		if (typeof val === 'object') return JSON.stringify(val);
		return String(val);
	}

	// Validates a readable token in the format:
	// word###-word###-word###
	//
	// Rules enforced:
	// - Trimmed input
	// - Length between 20 and 29 chars (based on your word list)
	// - Exactly 2 hyphens
	// - Only lowercase letters for words
	// - Exactly 3 digits per segment
	function validateReadableToken(input) {
		const token = input.trim();

		// Fast fail: empty input
		if (!token) return false;

		// Length bounds (derived from your design)
		if (token.length < 20 || token.length > 29) return false;

		// Must contain exactly 2 hyphens
		if ((token.match(/-/g)?.length ?? 0) !== 2) return false;

		// Strict format check: word###-word###-word###
		// Example: apple150-cloud200-earth100
		const tokenRegix = /^[a-z]+[0-9]{3}-[a-z]+[0-9]{3}-[a-z]+[0-9]{3}$/;
		if (!tokenRegix.test(token)) return false;

		return true;
	}

	// Handles token input changes and re-validates the token on every keystroke
	function onTokenInput(e) {
		tokenInput = e.target.value;
		isTokenValid = validateReadableToken(tokenInput);
	}

	__currentPage.set('Cloud Backup & Restore');
</script>

<PageHead title={'Cloud Backup & Restore'} />

<div class="mx-auto">
	<div class="markdown mx-auto">
		<h3>Cloud Backup & Restore</h3>
		<p>Back up and restore your settings across devices using a private, anonymous token. No account or email is required. Your settings are stored only when you manually back them up and restored only when you choose to. The token is the sole key to your cloud backup, so save it safely. It cannot be recovered if lost.</p>
	</div>

	<!-- No token saved: onboarding options -->
	{#if !savedToken}
		{#if view === 'main'}
			<div class="my-6 flex flex-col space-y-4 text-sm">
				<!-- Option A: Generate a new token -->
				<div class="flex flex-col space-y-2">
					<span class="text-theme-accent">New to Cloud Backup & Restore?</span>
					<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
						<div>Generate a unique token to start backing up your settings. You only need to do this once.</div>
						<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleGenerateToken}>
							{isGenerating ? 'Generating…' : 'Generate Token'}
						</button>
					</div>
				</div>

				<div class="border-b border-theme-accent/20"></div>

				<!-- Option B: Enter an existing token -->
				<div class="flex flex-col space-y-2">
					<span class="text-theme-accent">Already have a token?</span>
					<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
						<div>Enter a token you previously generated to restore your settings on this device.</div>
						<button
							class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}"
							on:click={() => {
								view = 'enter';
							}}
						>
							Enter Token
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Token entry panel -->
		{#if view === 'enter'}
			<div class="my-6 flex flex-col space-y-4 text-sm">
				<span class="text-theme-accent">Enter Your Token</span>
				<p>Please enter your token exactly as issued. Even small changes will make it invalid.</p>

				<div class="flex flex-col space-y-2">
					<input type="text" bind:value={tokenInput} on:input={onTokenInput} placeholder="e.g. valley250-smile200-peace350" class="bg-transparent block py-4 pl-4 rounded-3xl w-full z-20 text-sm border placeholder:text-theme-accent/50 border-theme-accent/20 focus:border-theme-accent focus:ring-theme-accent" maxlength="29" spellcheck="false" autocomplete="off" />
				</div>

				<div class="flex flex-row space-x-2">
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy || (!isTokenValid && disabledClasses)}" on:click={handleValidateToken}>
						{isValidating ? 'Validating…' : 'Validate & Save'}
					</button>
					<button
						class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}"
						on:click={() => {
							view = 'main';
							tokenInput = '';
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<!-- Token is saved: show backup / restore controls -->
	{:else}
		<div class="my-6 flex flex-col space-y-4 overflow-auto">
			<!-- Active token info -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Active Token</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<p>This token is saved on this device. Use it on other devices to restore your settings.</p>
					<div class="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
						<!-- Copy token button -->
						<button class="h-max whitespace-nowrap {buttonClasses}" on:click={handleCopyToken} disabled={isBusy}>
							{hasCopiedToken ? 'Copied' : 'Copy'}
						</button>

						<!-- Forget token button -->
						<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('Your cloud backup will not be deleted. You can re-enter the token at any time.', null, forgetLocalToken)}> Forget </button>
					</div>
				</div>
			</div>

			<div class="border-b border-theme-accent/20"></div>

			<!-- Backup settings -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Backup Settings</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div>
						Push your current settings to the cloud. This will overwrite any previous backup for this token.
						{#if backupMeta}
							<p class="mt-1 opacity-50">
								Last backed up: {formatDate(backupMeta.backed_up_at)}
							</p>
						{/if}
					</div>
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('This will overwrite your previous cloud backup.', null, handleBackup)}>
						{isBackingUp ? 'Backing up…' : 'Backup'}
					</button>
				</div>
			</div>

			<div class="border-b border-theme-accent/20"></div>

			<!-- Restore settings -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Restore Settings</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div>Fetch your cloud backup and preview it before applying. Your local settings will not change until you confirm.</div>
					<!-- Label changes to reflect whether a fetch is in progress -->
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestorePreview}>
						{isRestoring ? 'Fetching…' : 'Restore'}
					</button>
				</div>

				<!-- Restore preview panel — shown after fetching, before applying -->
				{#if restorePreview}
					{@const changedSettings = getChangedSettings(readLocalSettings() || {}, restorePreview.settings)}
					<div class="mt-2 flex flex-col space-y-3">
						<!-- Settings differ: show the diff list, the warning, and the apply button -->
						{#if changedSettings.length !== 0}
							<div class="flex flex-col space-y-1">
								<span>{changedSettings.length} setting{changedSettings.length === 1 ? '' : 's'} will change:</span>
								<div class="markdown">
									<ul>
										{#each changedSettings as change}
											<li class="text-xs">{change.path}: {formatValue(change.currentValue)} → {formatValue(change.newValue)}</li>
										{/each}
									</ul>
								</div>
							</div>

							<!-- Only shown when there is a diff and the apply button is visible -->
							<p>Applying this backup will replace your current local settings and reload the page.</p>

							<div class="flex flex-row space-x-2 mt-2">
								<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestoreConfirm}> Apply Backup </button>
								<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestoreCancel}> Cancel </button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
