<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage, __offlineDataSettings } from '$utils/stores';
	import { buttonClasses, disabledClasses } from '$data/commonClasses';
	import { registerServiceWorker, unregisterServiceWorkerAndClearCache } from '$utils/serviceWorkerHandler';
	import { updateSettings } from '$utils/updateSettings';
	import { showConfirm } from '$utils/confirmationAlertHandler';
	import Download from '$svgs/Download.svelte';
	import Trash from '$svgs/Trash.svelte';

	import { onMount } from 'svelte';

	let isRegistering = false;

	$: offlineDataSettings = $__offlineDataSettings;

	// Track if any download is in progress
	$: isDownloading = isRegistering;

	onMount(() => {
		// Listen for cache started
		window.addEventListener('sw-cache-started', () => {
			isRegistering = true;
		});

		// Listen for cache completion
		window.addEventListener('sw-cache-complete', () => {
			isRegistering = false;
			offlineDataSettings.swRegistered = true;
			updateSettings({ type: 'offlineDataSettings', value: offlineDataSettings });
		});
	});

	async function handleRegister() {
		isRegistering = true;
		const result = await registerServiceWorker();

		if (!result.success) {
			alert('Failed to enable offline mode: ' + result.error);
			isRegistering = false;
		}
	}

	async function handleUnregister() {
		await unregisterServiceWorkerAndClearCache();
		offlineDataSettings.swRegistered = false;
		updateSettings({ type: 'offlineDataSettings', value: offlineDataSettings });
	}

	__currentPage.set('offline');
</script>

<PageHead title={'Offline'} />

<div class="mx-auto">
	<div class="markdown mx-auto">
		<h3>Enable offline access to QuranWBW</h3>
		<p>In case you wish to use QuranWBW in offline mode, you can enable offline caching from this page. When enabled, parts of the website will be saved on your device, allowing you to access them even without an internet connection. This feature is completely optional, and any offline data can be updated or cleared at any time.</p>
	</div>

	<div class="mt-6 overflow-auto">
		<table class="w-full text-sm text-left rounded-md">
			<!-- <thead class="text-xs uppercase {window.theme('bgSecondaryLight')}">
				<tr>
					<th class="px-3 py-3">Resource</th>
					<th class="px-3 py-3 text-right">Action</th>
				</tr>
			</thead> -->
			<tbody>
				<!-- Service Worker & Core Files -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')}">
					<td class="py-4">
						<div class="font-semibold">Core Website Files</div>
						<div class="text-sm mt-1">Essential files required for offline access including all pages, chapters, and juz</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm space-x-2 {buttonClasses}" on:click={$__offlineDataSettings.swRegistered ? showConfirm('Are you sure you want to delete this data?', '', () => handleUnregister()) : handleRegister} disabled={isRegistering || isDownloading}>
							{#if $__offlineDataSettings.swRegistered}
								<Trash size={4} />
							{:else}
								<Download size={4} />
							{/if}

							<span>
								{#if $__offlineDataSettings.swRegistered}
									Delete
								{:else if isRegistering}
									Downloading...
								{:else}
									Download
								{/if}
							</span>
						</button>
					</td>
				</tr>

				<!-- Mushaf Fonts -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Mushaf Quran Fonts (comming soon)</div>
						<div class="text-sm mt-1">High-quality fonts for displaying the Quran in traditional Mushaf style</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>

				<!-- Additional Translations -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Additional Translations (comming soon)</div>
						<div class="text-sm mt-1">Extra translations in various languages for offline reading</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>

				<!-- Audio Recitations -->
				<tr class="{window.theme('bgMain')} border-b {window.theme('border')} {disabledClasses}">
					<td class="py-4">
						<div class="font-semibold">Audio Recitations (comming soon)</div>
						<div class="text-sm mt-1">Download recitations by various Qaris for offline listening</div>
					</td>
					<td class="py-4 text-right">
						<button class="text-sm {buttonClasses}" disabled={isDownloading}>
							<Download size={4} />
							<span>Download</span>
						</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
