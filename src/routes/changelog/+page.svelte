<script>
	import PageHead from '$misc/PageHead.svelte';
	import markdown from './CHANGELOG.md?raw';
	import { __currentPage } from '$utils/stores';
	import { marked } from 'marked';

	const description = 'Discover the latest updates, features, and improvements in QuranWBW.com.';

	// Parse the markdown into HTML
	const html = marked.parse(markdown);

	__currentPage.set('changelog');
</script>

<PageHead title={'Changelog'} {description} />

<div class="markdown mx-auto">
	{@html html}
</div>
