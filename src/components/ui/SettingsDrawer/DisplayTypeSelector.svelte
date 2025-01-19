<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __displayType, __currentPage } from '$utils/stores';
	import { selectableDisplays } from '$data/options';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { displayTypeChangeHandler } from '$utils/displayTypeChangeHandler';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(selectableDisplays) as [id, displayOption]}
		{#if !displayOption.disallowedIn.includes($__currentPage)}
			<Radio name="displayType" bind:group={$__displayType} value={displayOption.displayID} on:change={(event) => displayTypeChangeHandler(+event.target.value)} custom>
				<div class="{individualRadioClasses} {$__displayType === displayOption.displayID && selectedRadioOrCheckboxClasses}">
					<div class="w-full">{displayOption.displayName}</div>

					{#if $__displayType === displayOption.displayID}
						<Check size={5} />
					{/if}
				</div>
			</Radio>
		{/if}
	{/each}
</div>
