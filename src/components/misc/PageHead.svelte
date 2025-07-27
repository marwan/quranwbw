<script>
	export let title;

	import { websiteTagline, websiteTitle, websiteURL, wbwLanguages } from '$data/websiteSettings';
	import { page } from '$app/stores';
</script>

<svelte:head>
	<!-- HTML Meta Tags -->
	<title>{title} - {websiteURL}</title>
	<meta name="description" content="{title} - {websiteTagline} in {wbwLanguages} - {websiteURL}" />

	<!-- Facebook / Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$page.url.href} />
	<meta property="og:title" content="{title} - {websiteTagline} in {wbwLanguages}" />
	<meta property="og:description" content="{websiteTagline} in {wbwLanguages} - {websiteURL}" />
	<meta property="og:image" content="{$page.url.href}/images/icon-512.png" />
	<meta property="og:site_name" content={websiteTitle} />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="quranwbw.com" />
	<meta property="twitter:url" content={$page.url.href} />
	<meta name="twitter:title" content="{title} - {websiteTagline}" />
	<meta name="twitter:description" content="{websiteTagline} in {wbwLanguages} - {websiteURL}" />
	<meta name="twitter:image" content="{$page.url.href}/images/icon-512.png" />
</svelte:head>
