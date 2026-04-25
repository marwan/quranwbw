<script>
	import PageHead from '$misc/PageHead.svelte';
	import Info from '$svgs/Info.svelte';
	import { __currentPage } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { showConfirm } from '$utils/confirmationAlertHandler';

	// QuranWBW User Settings API
	const apiBase = 'http://localhost:7500/v2/user';

	// The localStorage key where settings are stored
	const settingsKey = 'userSettings';

	// The localStorage key where we persist the user's token locally
	// so they don't have to re-enter it every session
	const tokenStorageKey = 'cloudBackupAndRestoreToken';

	// The token currently saved in localStorage (auto-populated on mount)
	let savedToken = localStorage.getItem(tokenStorageKey) || '';

	// Input field for entering an existing token from another device
	let tokenInput = '';

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

	// Any inline error message to display
	let errorMessage = '';

	// Copy button state for active token
	let hasCopiedToken = false;
	let copyResetTimer;

	// True if any async operation is in progress
	$: isBusy = isGenerating || isValidating || isBackingUp || isRestoring;

	// Clear any visible error message
	function clearError() {
		errorMessage = '';
	}

	// Format an ISO date string into a human-readable local time
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

	// Generic fetch wrapper that adds the user-token header
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

		// Parse JSON even on error responses so we can show the server's message
		const json = await response.json().catch(() => ({ code: response.status, message: 'Unexpected response from server.' }));
		return { ok: response.ok, status: response.status, json };
	}

	// Actions

	// Generate a brand-new anonymous token
	async function handleGenerateToken() {
		isGenerating = true;
		clearError();

		try {
			const { ok, json } = await apiFetch('/tokens/generate', { method: 'POST' });

			if (!ok) {
				errorMessage = json.message || 'Failed to generate token.';
				return;
			}

			// Store the token locally immediately
			persistToken(json.token);
			view = 'generate';
		} catch {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isGenerating = false;
		}
	}

	// Validate a manually entered token from another device
	async function handleValidateToken() {
		const trimmed = tokenInput.trim();

		if (!trimmed) {
			errorMessage = 'Please enter your token.';
			return;
		}

		isValidating = true;
		clearError();

		try {
			const { ok, json } = await apiFetch('/tokens/validate', {
				method: 'GET',
				headers: { 'user-token': trimmed }
			});

			if (!ok) {
				// Distinguish "not found" from other errors
				errorMessage = json.code === 404 ? 'Token not found. Double-check it and try again.' : json.message || 'Validation failed.';
				return;
			}

			// Token is valid — save it locally and show the main panel
			persistToken(trimmed);
			tokenInput = '';
			view = 'main';
		} catch {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isValidating = false;
		}
	}

	// Backup current localStorage settings to the cloud
	async function handleBackup() {
		clearError();

		const settings = readLocalSettings();
		if (!settings) {
			errorMessage = 'No local settings found to back up.';
			return;
		}

		isBackingUp = true;

		try {
			const { ok, json } = await apiFetch('/settings', {
				method: 'POST',
				body: JSON.stringify(settings)
			});

			if (!ok) {
				errorMessage = json.message || 'Backup failed. Please try again.';
				return;
			}

			// Store backup metadata locally for display in the UI
			backupMeta = json.meta;
		} catch {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isBackingUp = false;
		}
	}

	// Fetch the cloud backup and show a preview before applying
	async function handleRestorePreview() {
		clearError();
		restorePreview = null;
		isRestoring = true;

		try {
			const { ok, json } = await apiFetch('/settings', { method: 'GET' });

			if (!ok) {
				errorMessage = json.code === 404 ? 'No cloud backup found for this token. Back up your settings first.' : json.message || 'Restore failed. Please try again.';
				return;
			}

			restorePreview = json.data;
		} catch {
			errorMessage = 'Network error. Please check your connection and try again.';
		} finally {
			isRestoring = false;
		}
	}

	// Apply the previewed settings after user confirms
	async function handleRestoreConfirm() {
		if (!restorePreview) return;

		// Verify integrity before applying
		// const isValid = await verifyChecksum(restorePreview.settings, restorePreview.checksum);
		// if (!isValid) {
		// 	showAlert('Integrity check failed. The backup data may be corrupted. Please try backing up again from your other device.', '');
		// 	restorePreview = null;
		// 	return;
		// }

		showConfirm('This will replace your current local settings. The page will reload.', null, () => applyRestoredSettings(restorePreview.settings));
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
								clearError();
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
				<p class="opacity-70">Paste your 32-character token exactly as it was shown to you when you first generated it.</p>

				<div class="flex flex-col space-y-2">
					<input type="text" bind:value={tokenInput} placeholder="e.g. a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" class="bg-transparent block py-4 pl-4 rounded-3xl w-full z-20 text-sm border placeholder:text-theme-accent/50 border-theme-accent/20 focus:border-theme-accent focus:ring-theme-accent" maxlength="32" spellcheck="false" autocomplete="off" />
				</div>

				<div class="flex flex-row space-x-2">
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy || (tokenInput.trim().length !== 32 && disabledClasses)}" on:click={handleValidateToken}>
						{isValidating ? 'Validating…' : 'Validate & Save'}
					</button>
					<button
						class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}"
						on:click={() => {
							view = 'main';
							tokenInput = '';
							clearError();
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
							<p class="mt-1 opacity-70 text-xs">
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
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestorePreview}>
						{isRestoring ? 'Fetching…' : 'Restore'}
					</button>
				</div>

				<!-- Restore preview panel — shown after fetching, before applying -->
				{#if restorePreview}
					<div class="mt-2 p-3 rounded-md bg-theme-accent/5 border border-theme-accent/20 flex flex-col space-y-3">
						<div class="flex flex-col space-y-1">
							<span class="text-xs uppercase tracking-wider">Backup Preview</span>
							<span class="opacity-70">Saved on: {formatDate(restorePreview.backed_up_at)}</span>
							<span class="opacity-70">Settings keys: {Object.keys(restorePreview.settings || {}).length} entries</span>
						</div>
						<p class="opacity-70 text-xs">Applying this backup will replace your current local settings and reload the page.</p>
						<div class="flex flex-row space-x-2">
							<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestoreConfirm}> Apply Backup </button>
							<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestoreCancel}> Cancel </button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Inline error message (shown below all panels) -->
	{#if errorMessage}
		<div class="mt-4 p-3 rounded-md flex flex-row space-x-1 items-start text-sm bg-theme-accent/5">
			<span class="flex-shrink-0 w-5 h-5 mt-1 md:mt-0.5"><Info /></span>
			<span>{errorMessage}</span>
		</div>
	{/if}
</div>
