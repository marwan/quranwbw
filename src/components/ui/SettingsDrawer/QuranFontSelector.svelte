<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { onMount } from 'svelte';
	import { __currentPage, __fontType, __offlineModeSettings } from '$utils/stores';
	import { selectableFontTypes, fontTypes } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { dataUnavailableWhileOfflineMessage, isUserOnline } from '$utils/offlineModeHandler';

	// Get downloaded font types from offline settings
	$: downloadedFontTypes = $__offlineModeSettings?.downloadedDataSettings?.fontTypes ?? [];

	// Network tracker
	let userOnline = false;
	let networkCheckPerformed = false;

	// Check online status on component mount
	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// Helper function to check if a font type should be shown
	function shouldShowFontType(fontType, fontKey) {
		// Check if font type is allowed on current page
		const isAllowedOnPage = !fontType.disallowedInPages.includes($__currentPage);

		// If user is online, only check page restrictions
		if (userOnline) {
			return isAllowedOnPage;
		}

		// If user is offline, check both page restrictions AND if font is downloaded
		const isFontDownloaded = downloadedFontTypes.includes(Number(fontKey));
		return isAllowedOnPage && isFontDownloaded;
	}

	// Helper function to check why a type has no visible fonts
	function getFontVisibilityStatus(type) {
		const fontsForType = Object.entries(selectableFontTypes).filter(([_, fontType]) => fontType.type === type);

		const pageAllowedFonts = fontsForType.filter(([_, fontType]) => !fontType.disallowedInPages.includes($__currentPage));

		// If no fonts are allowed on this page regardless of online status
		if (pageAllowedFonts.length === 0) {
			return 'not-allowed-on-page';
		}

		// Some fonts are page-allowed, check if any are visible (considering online/downloaded)
		const hasVisible = pageAllowedFonts.some(([fontKey, fontType]) => shouldShowFontType(fontType, fontKey));

		if (hasVisible) return 'has-visible';

		// Page-allowed fonts exist but none are visible — must be offline + not downloaded
		return 'offline-not-downloaded';
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each fontTypes as type}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="font-type" class="text-md font-medium capitalize">{type}</div>
				<div id="font-list" class="space-y-3">
					{#if getFontVisibilityStatus(type) === 'has-visible'}
						{#each Object.entries(selectableFontTypes).sort((a, b) => a[1].displayOrder - b[1].displayOrder) as [fontKey, fontType]}
							{#if fontType.type === type && shouldShowFontType(fontType, fontKey)}
								<Radio name="fontType" bind:group={$__fontType} value={Number(fontKey)} on:change={(event) => updateSettings({ type: 'fontType', value: +event.target.value })} custom>
									<div class="{individualRadioClasses} {$__fontType === Number(fontKey) && selectedRadioOrCheckboxClasses}">
										<div class="w-full">{fontType.font}</div>
									</div>
								</Radio>
							{/if}
						{/each}
					{:else if getFontVisibilityStatus(type) === 'not-allowed-on-page'}
						<p class="text-xs opacity-70">No data available.</p>
					{:else}
						<p class="text-xs opacity-70">{dataUnavailableWhileOfflineMessage}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
