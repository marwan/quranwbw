<script>
	import PageHead from '$misc/PageHead.svelte';
	import markdown from './PRIVACY.md?raw';
	import { __currentPage } from '$utils/stores';
	import { marked } from 'marked';

	// Parse the markdown into HTML
	const html = marked.parse(markdown);

	__currentPage.set('Privacy Policy');
</script>

<PageHead title={'Privacy Policy'} description="How QuranWBW.com handles your data: what stays on your device, what cloud backup stores, how analytics are used, and how to request deletion." />

<div class="markdown mx-auto">
	{@html html}
</div>
