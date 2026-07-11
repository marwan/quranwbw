<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { __displayType, __currentPage, __fontType, __signLanguageModeEnabled, __settingsSelectorModal } from '$utils/stores';
	import { selectableDisplays } from '$data/options';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { displayTypeChangeHandler } from '$utils/displayTypeChangeHandler';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableDisplays) as [_, displayOption]}
		{#if !((displayOption.disallowedInPages || []).includes($__currentPage) || ((displayOption.disallowedInFontTypes || []).includes($__fontType) && $__signLanguageModeEnabled))}
			<Radio
				name="displayType"
				bind:group={$__displayType}
				value={displayOption.displayID}
				on:change={(event) => {
					displayTypeChangeHandler(+event.target.value);
					$__settingsSelectorModal.visible = false;
				}}
				custom
			>
				<div class="{individualRadioClasses} {$__displayType === displayOption.displayID && selectedRadioOrCheckboxClasses}">
					<div class="w-full">{displayOption.displayName}</div>
				</div>
			</Radio>
		{/if}
	{/each}
</div>
