<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __currentPage, __fontType, __offlineModeSettings } from '$utils/stores';
	import { selectableFontTypes, fontTypes } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/serviceWorkerHandler';

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

	// Helper function to check if a type has any visible fonts
	function hasVisibleFonts(type) {
		return Object.entries(selectableFontTypes).some(([fontKey, fontType]) => {
			return fontType.type === type && shouldShowFontType(fontType, fontKey);
		});
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each fontTypes as type}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="font-type" class="text-md font-medium capitalize">{type}</div>
				<div id="font-list" class="space-y-3">
					{#if hasVisibleFonts(type)}
						{#each Object.entries(selectableFontTypes).sort((a, b) => a[1].displayOrder - b[1].displayOrder) as [fontKey, fontType]}
							{#if fontType.type === type && shouldShowFontType(fontType, fontKey)}
								<Radio name="fontType" bind:group={$__fontType} value={Number(fontKey)} on:change={(event) => updateSettings({ type: 'fontType', value: +event.target.value })} custom>
									<div class="{individualRadioClasses} {$__fontType === Number(fontKey) && selectedRadioOrCheckboxClasses}">
										<div class="w-full">{fontType.font}</div>

										{#if $__fontType === Number(fontKey)}
											<Check size={5} />
										{/if}
									</div>
								</Radio>
							{/if}
						{/each}
					{:else}
						<p class="text-xs opacity-70">No fonts available in this category</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
