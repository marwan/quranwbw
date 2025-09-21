<script>
	export let key;

	import { pageNumberKeys, juzNumberKeys } from '$data/quranMeta';
	import { __currentPage, __displayType } from '$utils/stores';
	import { selectableDisplays } from '$data/options';
	import { term } from '$utils/terminologies';

	const dividerClasses = `
		flex flex-row justify-center text-center mx-auto w-full mt-8 
		${selectableDisplays[`${$__displayType}`].continuous ? 'mb-4' : 'mb-1'} 
		py-2 px-4 text-sm rounded-full
		${window.theme('hoverBorder')}
		${window.theme('bgSecondaryLight')}
	`;
</script>

<!-- if the current key is the start of a page or juz  -->
{#if ['chapter', 'juz'].includes($__currentPage)}
	{@const isPage = pageNumberKeys.includes(key)}
	{@const isJuz = juzNumberKeys.includes(key)}

	{#if isPage || isJuz}
		<div class={dividerClasses}>
			{#if isPage}
				{@const pageIndex = pageNumberKeys.indexOf(key) + 1}
				Page {pageIndex}
			{/if}

			{#if isPage && isJuz}
				<span class="px-1 opacity-70">/</span>
			{/if}

			{#if isJuz}
				{@const juzIndex = juzNumberKeys.indexOf(key) + 1}
				{term('juz')}
				{juzIndex}
			{/if}
		</div>
	{/if}
{/if}
