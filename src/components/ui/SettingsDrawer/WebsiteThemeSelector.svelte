<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import Check from '$svgs/Check.svelte';
	import { __websiteTheme } from '$utils/stores';
	import { selectableThemes, themeColors } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { createLink } from '$utils/createLink';
</script>

<div class="grid gap-3 w-full">
	{#each themeColors as color}
		<div class="flex flex-col space-y-2 pb-6">
			<div id="color-name" class="text-md font-medium capitalize">{color}</div>
			<div id="color-list" class="space-y-3">
				{#each Object.entries(selectableThemes) as [_, theme]}
					{#if theme.color === color}
						<Radio name="websiteTheme" bind:group={$__websiteTheme} value={theme.id} on:change={(event) => updateSettings({ type: 'websiteTheme', value: +event.target.value })} custom>
							<div class="{individualRadioClasses} {$__websiteTheme === theme.id && selectedRadioOrCheckboxClasses}">
								<!-- <div class="flex flex-row pr-2">
									<div class="w-4 h-8 rounded-l-full {window.theme('bgMain', theme.id)}"></div>
									<div class="w-4 h-8 rounded-r-full {window.theme('bgSecondary', theme.id)}"></div>
								</div> -->
								<div class="w-full">{theme.name}</div>

								{#if $__websiteTheme === theme.id}
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

<div class="text-xs opacity-70 pb-8">Got a unique color combo in mind that's a visual delight? Shoot your suggestions over to {@html createLink('mailto:quranwbw@gmail.com', 'quranwbw@gmail.com')}.</div>
