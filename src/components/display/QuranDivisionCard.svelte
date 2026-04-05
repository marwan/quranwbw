<script>
	import Mecca from '$svgs/Mecca.svelte';
	import Madinah from '$svgs/Madinah.svelte';
	import Tooltip from '$ui/FlowbiteSvelte/tooltip/Tooltip.svelte';
	import { quranMetaData } from '$data/quranMeta';
	import { term } from '$utils/terminologies';

	export let type = 'chapter'; // 'chapter' | 'juz' | 'hizb'
	export let id = null; // chapter number (for chapter/favorites)
	export let juz = null; // juz object with .juz, .name, .from, .to, .icon
	export let hizb = null; // hizb object with .hizb, .from, .to

	const numberStarSvgPath =
		'<path class="opacity-15" d="M21.77,8.948a1.238,1.238,0,0,1-.7-1.7,3.239,3.239,0,0,0-4.315-4.316,1.239,1.239,0,0,1-1.7-.7,3.239,3.239,0,0,0-6.1,0,1.238,1.238,0,0,1-1.7.7A3.239,3.239,0,0,0,2.934,7.249a1.237,1.237,0,0,1-.7,1.7,3.24,3.24,0,0,0,0,6.1,1.238,1.238,0,0,1,.705,1.7A3.238,3.238,0,0,0,7.25,21.066a1.238,1.238,0,0,1,1.7.7,3.239,3.239,0,0,0,6.1,0,1.238,1.238,0,0,1,1.7-.7,3.239,3.239,0,0,0,4.316-4.315,1.239,1.239,0,0,1,.7-1.7,3.239,3.239,0,0,0,0-6.1Z" />';

	$: isJuz = type === 'juz';
	$: isHizb = type === 'hizb';
	$: isChapter = type === 'chapter';

	$: starValue = isJuz ? juz.juz : isHizb ? hizb.hizb : id;
	$: href = isJuz ? `/juz/${juz.juz}` : isHizb ? `/hizb/${hizb.hizb}` : `/${id}`;
</script>

<a {href}>
	<div class="{$$props.cardInnerClasses} flex-row text-center items-center">
		<div class="flex flex-row space-x-2">
			<!-- number star -->
			<div class="flex items-center">
				<svg class="w-10 h-10 rounded-full flex items-center justify-center" fill="var(--theme-accent-hex)" viewBox="0 0 24 24">
					{@html numberStarSvgPath}
					<text x="50%" y="53%" text-anchor="middle" stroke="var(--theme-accent-hex)" stroke-width="0.5px" dy=".3em" class="text" style="font-size: 7px;">{starValue}</text>
				</svg>
			</div>

			<div class="text-left">
				{#if isJuz}
					<!-- juz name -->
					<div class="flex flex-row items-center space-x-1 justify-start truncate">
						<div>{juz.name}</div>
					</div>
					<!-- juz range -->
					<div class="block text-xs truncate opacity-70">{juz.from} - {juz.to}</div>
				{:else if isHizb}
					<!-- hizb number -->
					<div class="flex flex-row items-center space-x-1 justify-start truncate">
						<div>{term('hizb')} {hizb.hizb}</div>
					</div>
					<!-- hizb range -->
					<div class="block text-xs truncate opacity-70">{hizb.from} - {hizb.to}</div>
				{:else}
					<!-- chapter name and revelation icon -->
					<div class="flex flex-row items-center space-x-1 justify-start truncate">
						<div>{quranMetaData[id].transliteration}</div>
						<div><svelte:component this={quranMetaData[id].revelation === 1 ? Mecca : Madinah} /></div>
						<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">
							{quranMetaData[id].revelation === 1 ? term('meccan') : term('medinan')} revelation
						</Tooltip>
					</div>
					<!-- chapter translation -->
					<div class="block text-xs truncate opacity-70">{quranMetaData[id].translation}</div>
					<!-- chapter verse count -->
					<div class="block text-xs opacity-70">{quranMetaData[id].verses} {term('verses')}</div>
				{/if}
			</div>
		</div>

		<!-- right side icon (hizb has no icon) -->
		{#if isJuz}
			<div class="juz-icons justify-items-end text-xl md:text-2xl" style="color: var(--theme-accent-hex)">{juz.icon}</div>
		{:else if isChapter}
			<div class="chapter-icons justify-items-end text-5xl" style="color: var(--theme-accent-hex)">{@html `&#xE9${quranMetaData[id].icon};`}</div>
		{/if}
	</div>
</a>
