<script>
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __verseTranslations, __offlineModeSettings } from '$utils/stores';
	import { selectableVerseTranslations, verseTranslationsLanguages } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualCheckboxClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/serviceWorkerHandler';

	// Get downloaded verse transliterations from offline settings
	$: downloadedVerseTransliterations = $__offlineModeSettings?.downloadedDataSettings?.verseTranslations ?? [];

	// Network tracker
	let userOnline = false;
	let networkCheckPerformed = false;

	// Check online status on component mount
	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// Helper function to check if a transliteration should be shown
	function shouldShowTransliteration(transliterationId) {
		// If user is online, show all transliterations
		if (userOnline) {
			return true;
		}

		// If user is offline, only show downloaded transliterations
		return downloadedVerseTransliterations.includes(transliterationId);
	}

	// Helper function to check if a language has any visible transliterations
	function hasVisibleTransliterations(languageId) {
		return Object.values(selectableVerseTranslations).some((transliteration) => {
			return transliteration.language_id === languageId && shouldShowTransliteration(transliteration.resource_id);
		});
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each Object.entries(verseTranslationsLanguages) as [_, language]}
			{#if language.language_id === 11115}
				<div class="flex flex-col space-y-2 pb-6">
					<div id="translation-name" class="text-md font-medium">{language.language}</div>
					<div id="translation-list" class="space-y-3">
						{#if hasVisibleTransliterations(language.language_id)}
							{#each Object.values(selectableVerseTranslations) as translation}
								{#if translation.language_id === language.language_id && shouldShowTransliteration(translation.resource_id)}
									<div class="flex items-center w-full">
										<Checkbox on:click={() => updateSettings({ type: 'verseTranslation', value: translation.resource_id })} custom>
											<div class="{individualCheckboxClasses} {$__verseTranslations.includes(translation.resource_id) && selectedRadioOrCheckboxClasses}">
												<div class="w-full">{translation.resource_name}</div>

												{#if $__verseTranslations.includes(translation.resource_id)}
													<Check size={5} />
												{/if}
											</div>
										</Checkbox>
									</div>
								{/if}
							{/each}
						{:else}
							<p class="text-xs opacity-70">No transliterations available</p>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="text-xs opacity-70 pb-8">Relying solely on transliteration to recite the Quran is not recommended, as it can lead to pronunciation errors. To fully appreciate and receive the reward and blessings of recitation, one should learn to read the Quran in Arabic.</div>
{/if}
