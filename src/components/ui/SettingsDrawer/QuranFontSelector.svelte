<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __currentPage, __fontType, __displayType, __chapterData, __chapterNumber } from '$utils/stores';
	import { selectableFontTypes, fontTypes } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each fontTypes as type}
		<div class="flex flex-col space-y-2 pb-6">
			<div id="font-type" class="text-md font-medium capitalize">{type}</div>
			<div id="font-list" class="space-y-3">
				{#each Object.entries(selectableFontTypes).sort((a, b) => a[1].displayOrder - b[1].displayOrder) as [key, fontType]}
					{#if fontType.type === type && !fontType.disallowedIn.includes($__currentPage)}
						<Radio name="fontType" bind:group={$__fontType} value={fontType.id} on:change={(event) => updateSettings({ type: 'fontType', value: +event.target.value })} custom>
							<div class="{individualRadioClasses} {$__fontType === fontType.id && selectedRadioOrCheckboxClasses}">
								<div class="w-full">{fontType.font}</div>

								{#if $__fontType === fontType.id}
									<Check size={5} />
								{/if}
							</div>
						</Radio>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
