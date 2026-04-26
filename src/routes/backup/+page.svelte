<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';

	// QuranWBW User Settings API
	// const apiBase = 'https://cloud-backup-api.quranwbw.com/user';
	const apiBase = 'http://localhost:8900/user';

	// The localStorage key where settings are stored
	const settingsKey = 'userSettings';

	// The localStorage key where we persist the user's backup key locally so they don't have to re-enter it every session
	const cloudBackupKeyLocalStorageItemName = 'cloudBackupAndRestoreBackupKey';

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

	// The backup key currently saved in localStorage (auto-populated on mount)
	let savedBackupKey = localStorage.getItem(cloudBackupKeyLocalStorageItemName) || '';

	// Input field for entering an existing backup key from another device
	let backupKeyInput = '';

	// Controls which "panel" is shown: 'main' | 'generate' | 'enter'
	let view = 'main';

	// Loading states for each async action
	let isGenerating = false;
	let isValidating = false;
	let isBackingUp = false;
	let isRestoring = false;

	// Metadata about the cloud backup (returned on restore-preview or backup success)
	let backupMeta = null;

	// Restore preview data — shown before applying to localStorage
	let restorePreview = null; // { settings, backed_up_at }

	// Copy button state for active backup key
	let hasCopiedBackupKey = false;
	let copyResetTimer;

	// True if any async operation is in progress
	$: isBusy = isGenerating || isValidating || isBackingUp || isRestoring;

	// Format an ISO date string into a human-readable local time.
	function formatDate(isoString) {
		if (!isoString) return 'Unknown';
		return new Date(isoString).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	// Persist the backup key to localStorage so the user doesn't have to re-enter it
	function persistBackupKey(backupKey) {
		localStorage.setItem(cloudBackupKeyLocalStorageItemName, backupKey);
		savedBackupKey = backupKey;
	}

	// Remove the locally stored backup key (does NOT delete cloud data)
	function forgetLocalBackupKey() {
		localStorage.removeItem(cloudBackupKeyLocalStorageItemName);
		savedBackupKey = '';
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

	// Apply restored settings to localStorage and trigger a page reload so all stores pick up the new values
	function applyRestoredSettings(settings) {
		localStorage.setItem(settingsKey, JSON.stringify(settings));

		// Reload so all Svelte stores re-initialise from localStorage
		window.location.reload();
	}

	// Generic fetch wrapper that adds the x-backup-key header.
	// Returns { ok, status, json } — callers should branch on status, not json.message.
	async function apiFetch(path, options = {}) {
		const headers = {
			'Content-Type': 'application/json',
			...(savedBackupKey ? { 'x-backup-key': savedBackupKey } : {}),
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
	// context is one of: 'generate' | 'validate' | 'backup' | 'restore'
	function getErrorForStatus(status, context) {
		switch (status) {
			case 400:
				if (context === 'validate') return 'That backup key is not valid. Please double-check and try again.';
				if (context === 'backup') return 'Could not save your settings. Please try again.';
				return 'Something went wrong. Please try again.';
			case 404:
				if (context === 'validate') return 'Backup key not found. Please double-check and try again.';
				if (context === 'restore') return 'No cloud backup found for this backup key. Back up your settings first.';
				return 'Not found. Please try again.';
			case 409:
				return 'A conflict occurred. Please refresh and try again.';
			case 413:
				return 'Your settings are too large to back up.';
			case 429:
				if (context === 'generate') return 'Backup key generation limit reached. Please try again later.';
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

	// Generate a brand-new anonymous backup key
	async function handleGenerateBackupKey() {
		isGenerating = true;

		try {
			const { ok, status, json } = await apiFetch('/backupKey/generate', { method: 'POST' });

			if (!ok) {
				showAlert(getErrorForStatus(status, 'generate'));
				return;
			}

			// Store the backup key locally immediately
			persistBackupKey(json.backupKey);
			view = 'generate';
		} catch {
			// Network-level failure (offline, DNS, CORS, etc.)
			showAlert(networkErrorMessage);
		} finally {
			isGenerating = false;
		}
	}

	// Validate a manually entered backup key from another device
	async function handleValidateBackupKey() {
		const trimmed = backupKeyInput.trim();

		if (!trimmed) {
			showAlert('Please enter your backup key.');
			return;
		}

		isValidating = true;

		try {
			const { ok, status } = await apiFetch('/backupKey/validate', {
				method: 'GET',
				headers: { 'x-backup-key': trimmed }
			});

			if (!ok) {
				showAlert(getErrorForStatus(status, 'validate'));
				return;
			}

			// Backup key is valid — save it locally and show the main panel
			persistBackupKey(trimmed);
			backupKeyInput = '';
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

	// Copies the active backup key to the clipboard and briefly shows "Copied" feedback.
	// Repeated clicks reset the timer so the feedback behaves correctly.
	function handleCopyBackupKey() {
		if (!savedBackupKey) return;

		navigator.clipboard?.writeText(savedBackupKey);

		hasCopiedBackupKey = true;

		// Handle repeated clicks safely
		clearTimeout(copyResetTimer);
		copyResetTimer = setTimeout(() => {
			hasCopiedBackupKey = false;
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

	// Deep equality check using JSON serialization
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

	__currentPage.set('Cloud Backup & Restore');
</script>

<PageHead title={'Cloud Backup & Restore'} />

<div class="mx-auto">
	<div class="markdown mx-auto">
		<h3>Cloud Backup & Restore</h3>
		<p>This feature lets you save your settings safely online and restore them on another device. You do not need an account or email. You will get a private backup key. This key is the only way to restore your settings later. Keep this key safe. If you lose it, your backup cannot be recovered.</p>
	</div>

	<!-- No backup key saved: onboarding options -->
	{#if !savedBackupKey}
		{#if view === 'main'}
			<div class="my-6 flex flex-col space-y-4 text-sm">
				<!-- Option A: Generate a new backup key -->
				<div class="flex flex-col space-y-2">
					<span class="text-theme-accent">First time using this?</span>
					<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
						<div>Generate a backup key to save your settings online. You only need to do this once.</div>
						<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleGenerateBackupKey}>
							{isGenerating ? 'Generating…' : 'Generate Backup Key'}
						</button>
					</div>
				</div>

				<div class="border-b border-theme-accent/20"></div>

				<!-- Option B: Enter an existing backup key -->
				<div class="flex flex-col space-y-2">
					<span class="text-theme-accent">Already have a backup key?</span>
					<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
						<div>Enter your backup key to load your saved settings on this device.</div>
						<button
							class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}"
							on:click={() => {
								view = 'enter';
							}}
						>
							Enter Your Backup Key
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Backup key entry panel -->
		{#if view === 'enter'}
			<div class="my-6 flex flex-col space-y-4 text-sm">
				<span class="text-theme-accent">Enter Your Backup Key</span>
				<p>Please enter your backup key exactly as issued. Spaces or small changes will make it invalid.</p>

				<div class="flex flex-col space-y-2">
					<input type="text" bind:value={backupKeyInput} placeholder="e.g. pal10-hop30-sky21-key28" maxlength="23" spellcheck="false" autocomplete="off" class="bg-transparent block py-4 pl-4 rounded-3xl w-full z-20 text-sm border placeholder:text-theme-accent/50 border-theme-accent/20 focus:border-theme-accent focus:ring-theme-accent" />
				</div>

				<div class="flex flex-row space-x-2">
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy || (backupKeyInput.length !== 23 && disabledClasses)}" on:click={handleValidateBackupKey}>
						{isValidating ? 'Validating…' : 'Validate & Save'}
					</button>
					<button
						class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}"
						on:click={() => {
							view = 'main';
							backupKeyInput = '';
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}

		<!-- Backup key is saved: show backup / restore controls -->
	{:else}
		<div class="my-6 flex flex-col space-y-4 overflow-auto">
			<!-- Active backup key info -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Your Saved Backup Key</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<p>This backup key is saved on this device. You can use it on other devices to restore your settings.</p>
					<div class="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
						<!-- Copy backup key button -->
						<button class="h-max whitespace-nowrap {buttonClasses}" on:click={handleCopyBackupKey} disabled={isBusy}>
							{hasCopiedBackupKey ? 'Copied' : 'Copy'}
						</button>

						<!-- Forget backup key button -->
						<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('Your cloud backup will not be deleted. You can re-enter the backup key at any time.', null, forgetLocalBackupKey)}> Forget </button>
					</div>
				</div>
			</div>

			<div class="border-b border-theme-accent/20"></div>

			<!-- Backup settings -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Save Settings to Cloud</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div>
						Save your current settings online. This will replace any previous backup for this key.
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
				<span class="text-theme-accent">Restore Settings from Cloud</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div>Load your saved settings and review them before applying. Your current settings will not change until you confirm.</div>

					<!-- Label changes to reflect whether a fetch is in progress -->
					<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestorePreview}>
						{isRestoring ? 'Fetching…' : 'Restore'}
					</button>
				</div>

				<!-- Restore preview panel — shown after fetching, before applying -->
				{#if restorePreview}
					{@const changedSettings = getChangedSettings(readLocalSettings() || {}, restorePreview.settings)}

					<!-- Settings differ: show the diff list, the warning, and the apply button -->
					<div class="mt-2 flex flex-col space-y-3">
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
							<p>This will replace your current settings and reload the page.</p>

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
