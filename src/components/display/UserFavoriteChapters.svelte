<script>
	import { quranMetaData } from '$data/quranMeta';
	import NumberStar from '$display/NumberStar.svelte';
	import ScrollableFadeContainer from '$display/ScrollableFadeContainer.svelte';
	import { __userFavoriteChapters } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import Star from '$svgs/Star.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';

	export let cardGridClasses;
	export let cardInnerClasses;

	$: hasFavorites = $__userFavoriteChapters.length > 0;
</script>

<ScrollableFadeContainer containerId="favorite-cards">
	{#if !hasFavorites}
		<div class="flex flex-row justify-start text-xs md:text-sm opacity-70 px-2">
			<span>
				You haven't favorited any {term('chapters')} yet! Start by clicking on the
				<Star classes="inline mt-[-4px]" /> icon next to a surah name while reading in surah view.
			</span>
		</div>
	{:else}
		<div>
			<div class="{cardGridClasses} grid-cols-1">
				{#each $__userFavoriteChapters as id (id)}
					<a href="/{id}">
						<div class="{cardInnerClasses} flex-row text-center items-center">
							<div class="flex flex-row space-x-2">
								<div class="flex items-center">
									<NumberStar value={id} />
								</div>

								<div class="text-left">
									<div class="flex flex-row items-center space-x-1 justify-start truncate">
										<div>{quranMetaData[id].transliteration}</div>
										<div><svelte:component this={quranMetaData[id].revelation === 1 ? Mecca : Madinah} /></div>
										<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">{quranMetaData[id].revelation === 1 ? term('meccan') : term('medinan')} revelation</Tooltip>
									</div>

									<div class="block text-xs truncate opacity-70">
										{quranMetaData[id].translation}
									</div>

									<div class="block text-xs opacity-70">
										{quranMetaData[id].verses}
										{term('verses')}
									</div>
								</div>
							</div>

							<div class="chapter-icons justify-items-end text-5xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[id].icon};`}</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</ScrollableFadeContainer>
