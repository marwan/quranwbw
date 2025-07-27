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
	<meta name="og:type" content="website" />
	<meta name="og:url" content={$page.url.href} />
	<meta name="og:title" content="{title} - {websiteTagline} in {wbwLanguages}" />
	<meta name="og:description" content="{websiteTagline} in {wbwLanguages} - {websiteURL}" />
	<meta name="og:image" content="{$page.url.href}images/icon-512.png" />
	<meta name="og:site_name" content={websiteTitle} />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:domain" content="quranwbw.com" />
	<meta name="twitter:url" content={$page.url.href} />
	<meta name="twitter:title" content="{title} - {websiteTagline}" />
	<meta name="twitter:description" content="{websiteTagline} in {wbwLanguages} - {websiteURL}" />
	<meta name="twitter:image" content="{$page.url.href}images/icon-512.png" />
</svelte:head>
