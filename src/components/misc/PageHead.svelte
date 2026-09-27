<script>
	export let title;
	export let description = undefined;

	import { websiteTagline, websiteURL, wbwLanguages } from '$data/websiteSettings';

	$: metaDescription = description ?? `${title} - ${websiteTagline} in ${wbwLanguages} - ${websiteURL}`;
</script>

<svelte:head>
	<title>{title} - {websiteURL}</title>
	<meta name="description" content={metaDescription} />
</svelte:head>
