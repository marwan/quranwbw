<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __wordTransliteration } from '$utils/stores';
	import { selectableWordTransliterations } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableWordTransliterations) as [_, translation]}
		<Radio name="wordTranslation" bind:group={$__wordTransliteration} value={translation.id} on:change={(event) => updateSettings({ type: 'wordTransliteration', value: +event.target.value })} custom>
			<div class="{individualRadioClasses} {$__wordTransliteration === translation.id && selectedRadioOrCheckboxClasses}">
				<div class="w-full">{translation.language}</div>

				{#if $__wordTransliteration === translation.id}
					<Check size={5} />
				{/if}
			</div>
		</Radio>
	{/each}
</div>

<div class="text-xs pt-6 opacity-70">Relying solely on transliteration to recite the Quran is not recommended, as it can lead to pronunciation errors. To fully appreciate and receive the reward and blessings of recitation, one should learn to read the Quran in Arabic.</div>
