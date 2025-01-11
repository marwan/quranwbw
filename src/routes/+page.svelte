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

	import Menu from '$svgs/Menu.svelte';
	import Search2Bold from '$svgs/Search2Bold.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';

	const topButtonClasses = 'inline-flex items-center rounded-full px-4 py-3 space-x-2 justify-center bg-[#b1901f]/5';

	__currentPage.set('home');
</script>

<PageHead title={`Quran ${websiteTagline}`} />

<div class="max-w-4xl mx-auto flex flex-col space-y-4 md:px-4">
	<!-- top menu -->
	<div class="flex flex-col mt-4">
		<div class="flex flex-row space-x-2 items-center justify-center">
			<div class="w-full flex flex-row justify-between" style="color: {window.theme('icon')}">
				<div>
					<button class={topButtonClasses}><SupplicationBold size={4} /><span class="text-black/40">Duas</span></button>
					<button class={topButtonClasses}><BookFilled size={4} /><span class="text-black/40">Mushaf</span></button>
					<button class={topButtonClasses}><MorphologyBold size={4} /><span class="text-black/40">Morphology</span></button>
				</div>

				<button class={topButtonClasses}><Menu size={4} /><span class="text-black/40">Menu</span></button>

				<!-- <span>Menu</span> -->
			</div>
		</div>
	</div>

	<!-- mid section -->
	<div class="flex flex-col mb-4 py-8 px-8 rounded-xl bg-[#b1901f]/5">
		<a href="/" class="flex flex-row space-x-4 items-center justify-left" style="color: {window.theme('icon')}" aria-label="Home">
			<div><Quran size={100} /></div>
			<div class="flex flex-col">
				<span class="text-3xl font-bold pb-2">Quran Word By Word</span>
				<!-- <Logo /> -->
				<!-- <div class="text-sm">Word By Word & Morphology.</div> -->
				<div class="text-sm text-black/40">Your companion for reading, listening to, and learning the Holy Quran, word by word. With features like word audios, Tajweed colors, and transliteration, you can delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.</div>
			</div>
		</a>
		<div id="search-bar" class="mt-8 rounded-full text-center text-black/50 bg-[#b1901f1f] px-4 py-2 w-full">Search or navigate Quran</div>
	</div>

	<!-- chapter and most read tabs -->
	<HomepageTabs />
</div>

<!-- banner for website updates: currently v4 launch -->
<!-- <Banner id="newSiteBanner" position="absolute" divClass="z-10 flex justify-between p-4">
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
</Banner> -->
