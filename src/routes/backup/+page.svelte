<script>
	import PageHead from '$misc/PageHead.svelte';

	import CloudBackup from '$svgs/CloudBackup.svelte';
	import CloudRestore from '$svgs/CloudRestore.svelte';
	import Share from '$svgs/Share.svelte';
	import Trash from '$svgs/Trash.svelte';
	import Copy from '$svgs/Copy.svelte';

	import { __currentPage } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { showConfirm, showAlert } from '$utils/confirmationAlertHandler';

	// QuranWBW User Settings API
	const apiBase = 'https://cloud-backup-api.quranwbw.com/user';

	// The localStorage key where settings are stored
	const settingsKey = 'userSettings';

	// The localStorage key where we store the backup key + all timestamps as a JSON object
	const cloudBackupKeyLocalStorageItemName = 'cloudBackupAndRestoreData';

	// Settings paths that should NEVER be overwritten during a restore.
	// Each entry is a dot-separated path into the userSettings object.
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
	let savedBackupKey = readBackupData().backupKey || '';

	// All three timestamps we track — null means the event has never happened
	let backupTimestamps = {
		keyCreatedAt: readBackupData().keyCreatedAt || null, // When the backup key was first generated
		lastBackedUpAt: readBackupData().lastBackedUpAt || null, // When settings were last pushed to the cloud
		lastRestoredAt: readBackupData().lastRestoredAt || null // When settings were last pulled from the cloud
	};

	// Input field for entering an existing backup key from another device
	let backupKeyInput = '';

	// Controls which "panel" is shown: 'main' | 'generate' | 'enter'
	let view = 'main';

	// Loading states for each async action
	let isGenerating = false;
	let isValidating = false;
	let isBackingUp = false;
	let isRestoring = false;

	// Restore preview data — shown before applying to localStorage
	let restorePreview = null; // { settings, backed_up_at }

	// Copy button state for active backup key
	let hasCopiedBackupKey = false;
	let copyResetTimer;

	// True if any async operation is in progress
	$: isBusy = isGenerating || isValidating || isBackingUp || isRestoring;

	// Format an ISO date string into a human-readable local time
	function formatDate(isoString) {
		if (!isoString) return 'Unknown';
		return new Date(isoString).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}

	// Persist the backup key and record the key creation timestamp.
	// Called only when generating a brand-new key.
	function persistBackupKey(backupKey) {
		const data = writeBackupData({ backupKey, keyCreatedAt: new Date().toISOString() });
		savedBackupKey = data.backupKey;
		backupTimestamps = { ...backupTimestamps, keyCreatedAt: data.keyCreatedAt };
	}

	// Remove all locally stored backup data (key + timestamps).
	// Does NOT delete the cloud backup — the user can re-enter the key at any time.
	function forgetLocalBackupKey() {
		localStorage.removeItem(cloudBackupKeyLocalStorageItemName);
		savedBackupKey = '';
		backupTimestamps = { keyCreatedAt: null, lastBackedUpAt: null, lastRestoredAt: null };
		restorePreview = null;
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

	// Generic fetch wrapper that adds the x-backup-key header and sends the user's local timezone with every request
	async function apiFetch(path, options = {}) {
		// Get user's local IANA timezone (e.g. "Asia/Kolkata")
		let localTimeZone = null;
		try {
			localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
		} catch {
			// Ignore — timezone is optional
		}

		const headers = {
			'Content-Type': 'application/json',

			// Send backup key if available
			...(savedBackupKey ? { 'x-backup-key': savedBackupKey } : {}),

			// Send user's local timezone so the server can store timestamps in the user's local time
			...(localTimeZone ? { 'x-user-timezone': localTimeZone } : {}),

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

			// Store the backup key and record the creation timestamp
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

			// Key is valid — save it locally without overwriting any existing timestamps
			// (we don't know the original creation date when entering a key from another device)
			writeBackupData({ backupKey: trimmed });
			savedBackupKey = trimmed;
			backupTimestamps = { ...backupTimestamps, ...readBackupData() };

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
			const { ok, status } = await apiFetch('/settings', {
				method: 'POST',
				body: JSON.stringify(settings)
			});

			if (!ok) {
				showAlert(getErrorForStatus(status, 'backup'));
				return;
			}

			// Record the backup timestamp locally
			const ts = new Date().toISOString();
			writeBackupData({ lastBackedUpAt: ts });
			backupTimestamps = { ...backupTimestamps, lastBackedUpAt: ts };

			// Clear any open restore preview — its data is now stale after a fresh backup
			restorePreview = null;
		} catch {
			showAlert(networkErrorMessage);
		} finally {
			isBackingUp = false;
		}
	}

	// Fetch the cloud backup and show a preview before applying
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

			// Show an alert if there is no difference between local and cloud settings
			if (changedSettings.length === 0) {
				restorePreview = null;
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

		// Record the restore timestamp before reloading the page
		const ts = new Date().toISOString();
		writeBackupData({ lastRestoredAt: ts });

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

		// Reset the "Copied" label after 2 seconds
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

	// Read the entire backup data object from localStorage
	function readBackupData() {
		try {
			const raw = localStorage.getItem(cloudBackupKeyLocalStorageItemName);
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	}

	// Merge a patch into the stored backup data object and persist it
	function writeBackupData(patch) {
		const current = readBackupData();
		const updated = { ...current, ...patch };
		localStorage.setItem(cloudBackupKeyLocalStorageItemName, JSON.stringify(updated));
		return updated;
	}

	__currentPage.set('cloud backup & restore');
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

				<!-- Option B: Enter an existing backup key from another device -->
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
			<!-- ----------------------------------------------------------------
				SECTION 1: Backup key info + actions
				Shows when the key was created (if known) and lets the user
				copy, share, or forget the key stored on this device.
			---------------------------------------------------------------- -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Your Saved Backup Key</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div class="flex flex-col">
						<p>A backup key is saved on this device. Copy or share it to use on another device.</p>
						<!-- Only shown if the key was generated on this device (not when entered from another device) -->
						{#if backupTimestamps.keyCreatedAt}
							<p class="opacity-70 mt-2">Key created: {formatDate(backupTimestamps.keyCreatedAt)}</p>
						{/if}
					</div>
					<div class="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
						<!-- Copy the backup key to clipboard -->
						<button class="text-sm space-x-2 h-max {buttonClasses}" on:click={handleCopyBackupKey} disabled={isBusy}>
							<Copy size={4} />
							<span>{hasCopiedBackupKey ? 'Copied' : 'Copy'}</span>
						</button>

						<!-- Open the device native share sheet with the backup key -->
						<button
							class="text-sm space-x-2 h-max {buttonClasses}"
							on:click={() => {
								if (navigator.share) {
									navigator.share({ title: 'My Backup Key', text: savedBackupKey });
								} else {
									// Fallback for browsers/devices that don't support the Web Share API
									navigator.clipboard?.writeText(savedBackupKey);
									showAlert('Share not supported on this device. Key copied to clipboard instead.');
								}
							}}
						>
							<Share size={4} />
							<span>Share</span>
						</button>

						<!-- Remove the key from this device only — cloud backup is preserved -->
						<button class="text-sm space-x-2 h-max {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('Your cloud backup will not be deleted. You can re-enter the backup key at any time.', null, forgetLocalBackupKey)}>
							<Trash size={4} />
							<span>Forget</span>
						</button>
					</div>
				</div>
			</div>

			<div class="border-b border-theme-accent/20"></div>

			<!-- ----------------------------------------------------------------
				SECTION 2: Backup settings to cloud
				Shows when settings were last backed up and lets the user
				push their current local settings to the cloud.
			---------------------------------------------------------------- -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Save Settings to Cloud</span>
				<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
					<div class="flex flex-col">
						<p>Save your current settings online. This will replace any previous backup for this key.</p>
						<!-- Timestamp recorded locally after each successful backup -->
						{#if backupTimestamps.lastBackedUpAt}
							<p class="opacity-70 mt-2">Last backed up: {formatDate(backupTimestamps.lastBackedUpAt)}</p>
						{/if}
					</div>
					<button class="text-sm space-x-2 h-max {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('This will overwrite your previous cloud backup.', null, handleBackup)}>
						<CloudBackup size={4} />
						<span>{isBackingUp ? 'Backing up…' : 'Backup'}</span>
					</button>
				</div>
			</div>

			<div class="border-b border-theme-accent/20"></div>

			<!-- ----------------------------------------------------------------
				SECTION 3: Restore settings from cloud
				Shows when settings were last restored and lets the user
				fetch and preview cloud settings before applying them.
			---------------------------------------------------------------- -->
			<div class="flex flex-col space-y-2 text-sm">
				<span class="text-theme-accent">Restore Settings from Cloud</span>

				<!--
					STEP 1: Restore (preview stage)
					No backup data has been loaded yet.
					The user can fetch their saved settings from the cloud to preview changes.
					Local settings remain untouched at this stage.
				-->
				{#if !restorePreview}
					<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
						<div class="flex flex-col">
							<p>Load your saved settings and review them before applying. Your current settings will not change until you confirm.</p>
							<!-- Timestamp recorded locally after each successful restore -->
							{#if backupTimestamps.lastRestoredAt}
								<p class="opacity-70 mt-2">Last restored: {formatDate(backupTimestamps.lastRestoredAt)}</p>
							{/if}
						</div>

						<button class="text-sm space-x-2 h-max {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestorePreview}>
							<CloudRestore size={4} />
							<span>{isRestoring ? 'Fetching…' : 'Restore'}</span>
						</button>
					</div>
				{/if}

				<!--
					STEP 2: Restore preview (confirmation stage)
					Backup data has been fetched from the cloud.
					Show only the settings that differ from the current local settings.
					The user must explicitly confirm before any changes are applied.
				-->
				{#if restorePreview}
					{@const changedSettings = getChangedSettings(readLocalSettings() || {}, restorePreview.settings)}
					{@const changedSettingsCount = changedSettings.length}

					<!-- Settings differ: show the diff count, apply button and cancel button -->
					{#if changedSettingsCount !== 0}
						<div class="flex flex-row space-x-8 md:space-x-24 justify-between">
							<div>A total of {changedSettingsCount} setting{changedSettingsCount === 1 ? '' : 's'} on this device will be updated. Your current settings will be replaced, and the page will reload.</div>
							<div class="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
								<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={() => showConfirm('This will restore the saved backup to this device. Your current settings on this device will be replaced, and the page will reload.', null, handleRestoreConfirm)}> Apply </button>
								<button class="h-max whitespace-nowrap {buttonClasses} {isBusy && disabledClasses}" on:click={handleRestoreCancel}> Cancel </button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
