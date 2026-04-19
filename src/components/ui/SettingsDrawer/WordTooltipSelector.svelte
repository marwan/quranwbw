<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { __wordTooltip } from '$utils/stores';
	import { selectableTooltipOptions } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableTooltipOptions) as [_, options]}
		<Radio name="wordTooltip" bind:group={$__wordTooltip} value={options.id} on:change={(event) => updateSettings({ type: 'wordTooltip', value: +event.target.value })} custom>
			<div class="{individualRadioClasses} {$__wordTooltip === options.id && selectedRadioOrCheckboxClasses}">
				<div class="w-full">{options.name}</div>
			</div>
		</Radio>
	{/each}
</div>
