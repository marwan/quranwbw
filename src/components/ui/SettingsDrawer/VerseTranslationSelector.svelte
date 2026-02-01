<script>
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __verseTranslations, __offlineModeSettings } from '$utils/stores';
	import { selectableVerseTranslations, verseTranslationsLanguages } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualCheckboxClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/serviceWorkerHandler';

	// Get downloaded verse translations from offline settings
	$: downloadedVerseTranslations = $__offlineModeSettings?.downloadedDataSettings?.verseTranslations ?? [];

	// Network tracker
	let userOnline = false;
	let networkCheckPerformed = false;

	// Check online status on component mount
	onMount(async () => {
		userOnline = await isUserOnline();
		networkCheckPerformed = true;
	});

	// Helper function to check if a translation should be shown
	function shouldShowTranslation(translationId) {
		// If user is online, show all translations
		if (userOnline) {
			return true;
		}

		// If user is offline, only show downloaded translations
		return downloadedVerseTranslations.includes(translationId);
	}

	// Helper function to check if a language has any visible translations
	function hasVisibleTranslations(languageId) {
		return Object.values(selectableVerseTranslations).some((translation) => {
			return translation.language_id === languageId && shouldShowTranslation(translation.resource_id);
		});
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each Object.entries(verseTranslationsLanguages) as [_, language]}
			{#if language.language_id !== 11115}
				<div class="flex flex-col space-y-2 pb-6">
					<div id="translation-name" class="text-md font-medium">{language.language}</div>
					<div id="translation-list" class="space-y-3">
						{#if hasVisibleTranslations(language.language_id)}
							{#each Object.values(selectableVerseTranslations) as translation}
								{#if translation.language_id === language.language_id && shouldShowTranslation(translation.resource_id)}
									<div class="flex items-center w-full">
										<Checkbox class="w-full" on:click={() => updateSettings({ type: 'verseTranslation', value: translation.resource_id })} custom>
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
							<p class="text-xs opacity-70">No translations available in this language</p>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="text-xs opacity-70 pb-8">The translations appear in the order you select them. To rearrange the sequence, simply deselect all options and then reselect them in your desired order.</div>
{/if}
