<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { __tajweedCompatibilityMode } from '$utils/stores';
	import { selectableTajweedCompatibilityModes } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableTajweedCompatibilityModes) as [_, options]}
		<Radio name="tajweedCompatibilityMode" bind:group={$__tajweedCompatibilityMode} value={options.id} on:change={(event) => updateSettings({ type: 'tajweedCompatibilityMode', value: event.target.value })} custom>
			<div class="{individualRadioClasses} {$__tajweedCompatibilityMode === options.id && selectedRadioOrCheckboxClasses}">
				<div class="w-full">{options.name}</div>
			</div>
		</Radio>
	{/each}
</div>
