<script>
	export let key = null;
	export let text = null;

	import { pageNumberKeys, juzNumberKeys, hizbNumberKeys } from '$data/quranMeta';
	import { __currentPage, __displayType } from '$utils/stores';
	import { selectableDisplays } from '$data/options';
	import { term } from '$utils/terminologies';

	// Shared styling; bottom margin depends on whether the display type is continuous
	const dividerClasses = `
		flex flex-row justify-center text-center mx-auto w-full mt-8 
		${selectableDisplays[`${$__displayType}`].continuous ? 'mb-4' : 'mb-1'} 
		py-2 px-4 text-sm rounded-full
		border border-transparent hover:border-theme-accent
		bg-theme-accent/5
	`;

	// Labels to render (e.g. "Page 3", "Juz 1"); stays empty when nothing applies
	$: dividerItems = [];

	// Build the labels only when no custom text is passed and we're on a chapter, juz, or hizb page.
	// A label is added for each boundary (page, juz, hizb) that starts at this key.
	$: if (text === null && ['chapter', 'juz', 'hizb'].includes($__currentPage)) {
		const items = [];
		const pageIndex = pageNumberKeys.indexOf(key);
		const juzIndex = juzNumberKeys.indexOf(key);
		const hizbIndex = hizbNumberKeys.indexOf(key);

		if (pageIndex > -1) items.push(`Page ${pageIndex + 1}`);
		if (juzIndex > -1) items.push(`${term('juz')} ${juzIndex + 1}`);
		if (hizbIndex > -1) items.push(`${term('hizb')} ${hizbIndex + 1}`);

		dividerItems = items;
	} else {
		dividerItems = [];
	}
</script>

<!-- Custom text mode: show only the passed text (e.g. "Top Matches") -->
{#if text !== null}
	<div class={dividerClasses}>
		<span>{text}</span>
	</div>
	<!-- Key mode: the key starts a page, juz, or hizb, so show those labels separated by bullets -->
{:else if dividerItems.length > 0}
	<div class={dividerClasses}>
		{#each dividerItems as item, index}
			<span>{item}</span>
			<!-- Bullet separator between labels, none after the last one -->
			{#if index < dividerItems.length - 1}
				<span class="px-1 opacity-30">&#8226;</span>
			{/if}
		{/each}
	</div>
{/if}
