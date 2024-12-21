<script>
	import PageHead from '$misc/PageHead.svelte';
	import HomepageTabs from '$ui/HomepageTabs.svelte';
	import Logo from '$svgs/Logo.svelte';
	import Quran from '$svgs/Quran.svelte';
	import Megaphone from '$svgs/Megaphone.svelte';
	import Banner from '$ui/FlowbiteSvelte/banner/Banner.svelte';
	import { websiteTagline } from '$data/websiteSettings';
	import { __currentPage, __lastRead, __changelogModalVisible } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';
	import { websitechangelog } from '$data/changelog';

	__currentPage.set('home');
</script>

<PageHead title={`Quran ${websiteTagline}`} />

<div class="max-w-4xl mx-auto flex flex-col space-y-6 md:px-4">
	<div class="flex flex-col mt-4 mb-4">
		<a href="/" class="flex flex-col items-center justify-center" style="color: {window.theme('icon')}" aria-label="Home">
			<div><Quran size={70} /></div>
			<div class="flex flex-col">
				<Logo />
				<div class="text-xs text-center">Word By Word & Morphology</div>
			</div>
		</a>
	</div>

	<!-- chapter and most read tabs -->
	<HomepageTabs />
</div>

<!-- banner for website updates: currently v4 launch -->
<Banner id="newSiteBanner" position="absolute" divClass="z-10 flex justify-between p-4">
	<p class="flex items-center text-sm font-normal space-x-1 truncate">
		<span class="inline-flex p-2 rounded-full border {window.theme('border')}">
			<span><Megaphone size={3} /></span>
			<span class="sr-only">Announcement</span>
		</span>

		<span class="text-xs md:text-sm">
			{#if websitechangelog[0].title}
				{websitechangelog[0].title}.
			{:else}
				Update {websitechangelog[0].version}.
			{/if}

			<button class={linkClasses} on:click={() => __changelogModalVisible.set(true)}> See What's New {@html '&#x2192;'}</button>
		</span>
	</p>
</Banner>
