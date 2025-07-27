<script>
	export let title;

	import { websiteTagline, websiteURL, wbwLanguages } from '$data/websiteSettings';
</script>

<svelte:head>
	<title>{title} - {websiteURL}</title>
	<meta name="description" content="{title} - {websiteTagline} in {wbwLanguages} - {websiteURL}" />
</svelte:head>
