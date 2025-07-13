<script>
	import PageHead from '$misc/PageHead.svelte';
	import { __currentPage } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';
	import { websiteFAQs } from '$data/faq';

	// https://stackoverflow.com/a/59862556
	function linkMarkdown(string) {
		return string.replace(/\[.*?\]\(.*?\)/g, (text) => {
			let [_, name, link] = /\[(.*?)\]\((.*?)\)/g.exec(text);
			return `<a href="${link}" target="_blank" class="${linkClasses}">${name}</a>`;
		});
	}

	__currentPage.set('faq');
</script>

<PageHead title={'FAQ'} />

<div class="theme">
	<div class="my-6 space-y-4 pb-4 border-b-2 {window.theme('border')}">
		<h1 class="text-2xl">Frequently Asked Questions</h1>
	</div>

	<div class="text-sm">
		{#each Object.entries(websiteFAQs) as [key, value]}
			<div id={+key + 1} class="py-6 space-y-2 border-b {window.theme('border')}">
				<div class="flex flex-col space-y-2">
					<div class="font-medium">#{+key + 1}: {value.question}</div>
					<div>{@html linkMarkdown(value.answer)}</div>
				</div>
			</div>
		{/each}
	</div>
</div>
