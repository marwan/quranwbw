<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { onMount } from 'svelte';
	import { __wordTransliteration, __offlineModeSettings } from '$utils/stores';
	import { selectableWordTransliterations } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { isUserOnline } from '$utils/offlineModeHandler';

	// Get downloaded word transliterations from offline settings
	$: downloadedWordTransliterations = $__offlineModeSettings?.downloadedDataSettings?.wordTransliterations ?? [];

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
		return downloadedWordTransliterations.includes(transliterationId);
	}
</script>

{#if networkCheckPerformed}
	<div class="grid gap-3 w-full">
		{#each Object.entries(selectableWordTransliterations) as [_, translation]}
			{#if shouldShowTransliteration(translation.id)}
				<Radio name="wordTranslation" bind:group={$__wordTransliteration} value={translation.id} on:change={(event) => updateSettings({ type: 'wordTransliteration', value: +event.target.value })} custom>
					<div class="{individualRadioClasses} {$__wordTransliteration === translation.id && selectedRadioOrCheckboxClasses}">
						<div class="w-full">{translation.language}</div>

						{#if $__wordTransliteration === translation.id}
							<Check size={5} />
						{/if}
					</div>
				</Radio>
			{/if}
		{/each}
	</div>

	<div class="text-xs pt-6 opacity-70">Relying solely on transliteration to recite the Quran is not recommended, as it can lead to pronunciation errors. To fully appreciate and receive the reward and blessings of recitation, one should learn to read the Quran in Arabic.</div>
{/if}
