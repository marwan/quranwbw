<script>
	import Radio from '$ui/FlowbiteSvelte/forms/Radio.svelte';
	import { __reciter, __translationReciter } from '$utils/stores';
	import { selectableReciters, selectableTranslationReciters } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualRadioClasses } from '$data/commonClasses';
	import { staticEndpoint } from '$data/websiteSettings';

	$: reciterImageClasses = 'rounded-full size-10';
</script>

<div class="grid gap-3 w-full">
	<!-- Translated Audios -->
	<div class="flex flex-col space-y-2 pb-6">
		<div id="audio-name" class="text-md font-medium">Translation</div>
		<div id="audio-list" class="space-y-3">
			{#each Object.entries(selectableTranslationReciters) as [_, reciter]}
				<Radio name="reciter" bind:group={$__translationReciter} value={reciter.id} on:change={(event) => updateSettings({ type: 'translationReciter', value: +event.target.value })} custom>
					<div class="{individualRadioClasses} {$__translationReciter === reciter.id && selectedRadioOrCheckboxClasses}">
						<div class="w-full">{reciter.reciter}</div>
					</div>
				</Radio>
			{/each}
		</div>
	</div>

	<!-- Arabic Audios -->
	<div class="flex flex-col space-y-2 pb-6">
		<div id="audio-name" class="text-md font-medium">Arabic</div>
		<div id="audio-list" class="space-y-3">
			{#each Object.entries(selectableReciters).sort((a, b) => a[1].reciter.localeCompare(b[1].reciter)) as [_, reciter]}
				<Radio name="reciter" bind:group={$__reciter} value={reciter.id} on:change={(event) => updateSettings({ type: 'reciter', value: +event.target.value })} custom>
					<div class="{individualRadioClasses} px-5 py-3 {$__reciter === reciter.id && selectedRadioOrCheckboxClasses}">
						<div class="flex flex-row space-x-2 items-center w-full">
							<img src="{staticEndpoint}/images/reciters/{reciter.image}" class={reciterImageClasses} alt={reciter.reciter} />
							<span class="truncate pr-2">{reciter.reciter}</span>
						</div>

						{#if reciter.tags?.length}
							<div class="flex flex-row space-x-1">
								{#each [...reciter.tags].reverse() as tag}
									<span class="px-2 py-1 rounded-full text-xs h-max bg-theme-accent text-theme-bg">
										{tag.toUpperCase()}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</Radio>
			{/each}
		</div>
	</div>
</div>
