<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __currentPage, __fontType, __displayType, __chapterData, __chapterNumber } from '$utils/stores';
	import { selectableFontTypes } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	<!-- render the list in custom order -->
	{#each [1, 2, 3, 4, 6, 5] as key}
		{#if !selectableFontTypes[key].disallowedIn.includes($__currentPage)}
			<Radio name="fontType" bind:group={$__fontType} value={selectableFontTypes[key].id} on:change={(event) => updateSettings({ type: 'fontType', value: +event.target.value })} custom>
				<div class="{individualRadioClasses} {$__fontType === selectableFontTypes[key].id && selectedRadioOrCheckboxClasses}">
					<div class="w-full">{selectableFontTypes[key].font}</div>

					{#if $__fontType === selectableFontTypes[key].id}
						<Check size={5} />
					{/if}
				</div>
			</Radio>
		{/if}
	{/each}
</div>
