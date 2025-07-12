<script>
	import Checkbox from '$ui/FlowbiteSvelte/forms/Checkbox.svelte';
	import Check from '$svgs/Check.svelte';
	import { __verseTranslations } from '$utils/stores';
	import { selectableVerseTranslations, verseTranslationsLanguages } from '$data/options';
	import { updateSettings } from '$utils/updateSettings';
	import { selectedRadioOrCheckboxClasses, individualCheckboxClasses } from '$data/commonClasses';
</script>

<div class="grid gap-3 w-full">
	{#each Object.entries(verseTranslationsLanguages) as [_, language]}
		{#if language.language_id === 11115}
			<div class="flex flex-col space-y-2 pb-6">
				<div id="translation-name" class="text-md font-medium">{language.language}</div>
				<div id="translation-list" class="space-y-3">
					{#each Object.values(selectableVerseTranslations) as translation}
						{#if translation.language_id === language.language_id}
							<div class="flex items-center w-full">
								<Checkbox on:click={() => updateSettings({ type: 'verseTranslation', value: translation.resource_id })} custom>
									<div class="{individualCheckboxClasses} {$__verseTranslations.includes(translation.resource_id) && selectedRadioOrCheckboxClasses}">
										<div class="w-full">{translation.resource_name}</div>

										{#if $__verseTranslations.includes(translation.resource_id)}
											<Check size={5} />
										{/if}
									</div>
								</Checkbox>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<div class="text-xs opacity-70 pb-8">Relying solely on transliteration to recite the Quran is not recommended, as it can lead to pronunciation errors. To fully appreciate and receive the reward and blessings of recitation, one should learn to read the Quran in Arabic.</div>
