<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __wordTranslation } from '$utils/stores';
	import { selectableWordTranslations } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableWordTranslations).sort((a, b) => a[1].language.localeCompare(b[1].language)) as [id, translation]}
		<Radio name="wordTranslation" bind:group={$__wordTranslation} value={translation.id} on:change={(event) => updateSettings({ type: 'wordTranslation', value: +event.target.value })} custom>
			<div class="{individualRadioClasses} {$__wordTranslation === translation.id && selectedRadioOrCheckboxClasses}">
				<div class="w-full">{translation.language}</div>

				{#if $__wordTranslation === translation.id}
					<Check size={5} />
				{/if}
			</div>
		</Radio>
	{/each}
</div>
