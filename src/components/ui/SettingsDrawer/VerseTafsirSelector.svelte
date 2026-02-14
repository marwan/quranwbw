<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __verseTafsir, __offlineModeSettings } from '$utils/stores';
	import { verseTafsirLanguages, selectableTafsirs } from '$data/selectableTafsirs';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/offlineModeHandler';

	// Get downloaded tafsirs from offline settings
	$: downloadedTafsirs = $__offlineModeSettings?.downloadedDataSettings?.tafsirs ?? [];

	// Network tracker
	let userOnline = false;
	let networkCheckPerformed = false;

	// Check online status on component mount
	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// Helper function to check if a tafsir should be shown
	function shouldShowTafsir(tafsirId) {
		// If user is online, show all tafsirs
		if (userOnline) {
			return true;
		}

		// If user is offline, only show downloaded tafsirs
		return downloadedTafsirs.includes(tafsirId);
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each Object.entries(verseTafsirLanguages) as [_, language]}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="translation-name" class="text-md font-medium">{language.language}</div>
				<div id="translation-list" class="space-y-3">
					{#if shouldShowTafsir(language.language)}
						{#each Object.entries(selectableTafsirs) as [_, tafsir]}
							{#if tafsir.language === language.language && shouldShowTafsir(tafsir.id)}
								<div class="flex items-center w-full">
									<Radio name="verseTafsir" bind:group={$__verseTafsir} value={tafsir.id} on:change={(event) => updateSettings({ type: 'verseTafsir', value: +event.target.value })} custom>
										<div class="{individualRadioClasses} {$__verseTafsir === tafsir.id && selectedRadioOrCheckboxClasses}">
											<div class="flex flex-col space-y-2 w-full">
												<span>{tafsir.name}</span>
												<!-- <span class="text-xs font-normal">{tafsir.author}</span> -->
											</div>

											{#if $__verseTafsir === tafsir.id}
												<Check size={5} />
											{/if}
										</div>
									</Radio>
								</div>
							{/if}
						{/each}
					{:else}
						<p class="text-xs opacity-70">No tafsirs available</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
