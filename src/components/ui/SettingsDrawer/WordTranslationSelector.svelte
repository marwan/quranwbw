<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __wordTranslation, __offlineModeSettings } from '$utils/stores';
	import { selectableWordTranslations } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/offlineModeHandler';

	// Get downloaded word translations from offline settings
	$: downloadedWordTranslations = $__offlineModeSettings?.downloadedDataSettings?.wordTranslations ?? [];

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
		return downloadedWordTranslations.includes(translationId);
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each Object.entries(selectableWordTranslations).sort((a, b) => a[1].language.localeCompare(b[1].language)) as [_, translation]}
			{#if shouldShowTranslation(translation.id)}
				<Radio name="wordTranslation" bind:group={$__wordTranslation} value={translation.id} on:change={(event) => updateSettings({ type: 'wordTranslation', value: +event.target.value })} custom>
					<div class="{individualRadioClasses} {$__wordTranslation === translation.id && selectedRadioOrCheckboxClasses}">
						<div class="w-full">{translation.language}</div>

						{#if $__wordTranslation === translation.id}
							<Check size={5} />
						{/if}
					</div>
				</Radio>
			{/if}
		{/each}
	</div>
{/if}
