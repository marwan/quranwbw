<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { onMount } from 'svelte';
	import { __verseTafsir, __offlineModeSettings } from '$utils/stores';
	import { verseTafsirLanguages, selectableTafsirs } from '$data/selectableOptions';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { dataUnavailableWhileOfflineMessage, isUserOnline } from '$utils/offlineModeHandler';

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

	// Tafsirs grouped by language; all when online, only downloaded ones when offline
	$: tafsirsByLanguage = Object.values(verseTafsirLanguages).map((language) => ({
		language: language.language,
		tafsirs: Object.values(selectableTafsirs).filter((tafsir) => tafsir.language === language.language && (userOnline || downloadedTafsirs.includes(tafsir.id)))
	}));
</script>

{#if networkCheckPerformed}
	{@const availableGroups = tafsirsByLanguage.filter((group) => group.tafsirs.length > 0)}

	<div class="grid gap-3 w-full">
		{#each availableGroups as { language, tafsirs } (language)}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="translation-name" class="font-medium">{language}</div>
				<div id="translation-list" class="space-y-3">
					{#each tafsirs as tafsir (tafsir.id)}
						<div class="flex items-center w-full">
							<Radio name="verseTafsir" bind:group={$__verseTafsir} value={tafsir.id} on:change={(event) => updateSettings({ type: 'verseTafsir', value: +event.target.value })} custom>
								<div class="{individualRadioClasses} {$__verseTafsir === tafsir.id && selectedRadioOrCheckboxClasses}">
									<div class="flex flex-col space-y-2 w-full">
										<span>{tafsir.name}</span>
									</div>
								</div>
							</Radio>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<p class="text-xs opacity-70">{dataUnavailableWhileOfflineMessage}</p>
		{/each}
	</div>
{/if}
