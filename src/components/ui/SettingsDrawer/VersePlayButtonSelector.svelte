<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __playButtonsFunctionality } from '$utils/stores';
	import { selectableVersePlayButtonOptions } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableVersePlayButtonOptions) as [_, options]}
		<Radio name="wordTooltip" bind:group={$__playButtonsFunctionality.verse} value={options.id} on:change={(event) => updateSettings({ type: 'versePlayButton', value: +event.target.value })} custom>
			<div class="{individualRadioClasses} {$__playButtonsFunctionality.verse === options.id && selectedRadioOrCheckboxClasses}">
				<div class="w-full">{options.name}</div>

				{#if $__playButtonsFunctionality.verse === options.id}
					<Check size={5} />
				{/if}
			</div>
		</Radio>
	{/each}
</div>
