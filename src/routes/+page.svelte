<script>
	import PageHead from '$misc/PageHead.svelte';
	import HomepageTabs from '$ui/HomepageTabs.svelte';
	import Logo from '$svgs/Logo.svelte';
	import Quran from '$svgs/Quran.svelte';
	import Megaphone from '$svgs/Megaphone.svelte';
	import Banner from '$ui/FlowbiteSvelte/banner/Banner.svelte';
	import { websiteTagline } from '$data/websiteSettings';
	import { __currentPage, __lastRead, __changelogModalVisible, __timeSpecificChapters } from '$utils/stores';
	import { linkClasses } from '$data/commonClasses';
	import { websitechangelog } from '$data/changelog';
	import { quranMetaData } from '$data/quranMeta';
	import { checkTimeSpecificChapters } from '$utils/checkTimeSpecificChapters';

	import Menu from '$svgs/Menu.svelte';
	import Search2Bold from '$svgs/Search2Bold.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';
	import Moon from '$svgs/Moon.svelte';
	import Cave from '$svgs/Cave.svelte';
	import Search from '$svgs/Search.svelte';

	// Check if it's Friday and nighttime
	checkTimeSpecificChapters();

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
					<button class={topButtonClasses}><SupplicationBold size={4} /><span class="hidden md:block text-black/40">Duas</span></button>
					<button class={topButtonClasses}><BookFilled size={4} /><span class="hidden md:block text-black/40">Mushaf</span></button>
					<button class={topButtonClasses}><MorphologyBold size={4} /><span class="hidden md:block text-black/40">Morphology</span></button>
				</div>

				<button class={topButtonClasses}><Menu size={4} /><span class="hidden md:block text-black/40">Menu</span></button>

				<!-- <span>Menu</span> -->
			</div>
		</div>
	</div>

	<!-- mid section -->
	<div class="flex flex-col mb-4 py-8 px-6 md:px-8 rounded-xl bg-[#b1901f]/5">
		<a href="/" class="flex flex-row space-x-4 items-center justify-left" style="color: {window.theme('icon')}" aria-label="Home">
			<div class="hidden mb:block"><Quran size={100} /></div>
			<div class="block mb:hidden"><Quran size={80} /></div>
			<div class="flex flex-col">
				<span class="text-xl md:text-3xl font-bold pb-2 block md:hidden">QuranWBW</span>
				<span class="text-xl md:text-3xl font-bold pb-2 hidden md:block">Quran Word By Word</span>
				<!-- <Logo /> -->
				<!-- <div class="text-sm">Word By Word & Morphology.</div> -->
				<div class="text-sm text-black/40 hidden md:block">Your companion for reading, listening to, and learning the Holy Quran, word by word. With features like word audios, Tajweed colors, and transliteration, delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.</div>
				<div class="text-sm text-black/40 block md:hidden">Your companion for reading, listening to, and learning the Holy Quran, word by word.</div>
			</div>
		</a>
		<div id="search-bar" class="mt-8 rounded-full text-center text-black/50 bg-[#b1901f]/5 px-4 py-2 flex flex-row items-center justify-center space-x-1 w-full">
			<Search size={7} classes="pt-1" />
			<span>Search or navigate Quran</span>
		</div>

		<!-- <div class="pt-6 text-xs flex flex-row space-x-4 text-black/40">
			<div>Continue Reading Al-Faatiha, 1:7 {@html '&#10230'}</div>
			<div>|</div>
			<div>It's Friday, Read Al-Kahf {@html '&#10230'}</div>
			<div>|</div>
			<div>Before Sleeping, Read Al-Mulk {@html '&#10230'}</div>
		</div> -->
	</div>

	<!-- extras: continue reading, time specific chapters -->
	<!-- <div class="flex flex-col mt-4 text-sm">
		<div class="flex flex-row space-x-2 items-center justify-center">
			<div class="w-full flex flex-row space-x-4 items-center" style="color: {window.theme('icon')}">
				<div class="flex flex-row space-x-2 w-full">
					{#if $__lastRead.hasOwnProperty('key')}
						{@const [lastReadChapter, lastReadVerse] = $__lastRead.key.split(':').map(Number)}
						<a href="/{lastReadChapter}/{lastReadVerse}" class="{topButtonClasses} w-full">
							<span class="hidden md:block">Continue Reading: {quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}</span>
							<span class="block md:hidden">{lastReadChapter}:{lastReadVerse} </span>
						</a>
					{/if}

					{#if $__timeSpecificChapters.isFriday || $__timeSpecificChapters.isNight}
						{#if $__timeSpecificChapters.isFriday}
							<a href="/18" class="{topButtonClasses} w-full">
								<span class="-mt-1"><Cave size={4} /></span>
								<span class="hidden md:block">It's Friday:</span>
								<span>Al-Kahf</span>
							</a>
						{/if}

						{#if $__timeSpecificChapters.isNight}
							<a href="/67" class="{topButtonClasses} w-full">
								<span><Moon size={3.5} /></span>
								<span class="hidden md:block">Before Sleeping:</span>
								<span>Al-Mulk</span>
							</a>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div> -->

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
