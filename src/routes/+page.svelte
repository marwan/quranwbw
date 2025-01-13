<script>
	import PageHead from '$misc/PageHead.svelte';
	import HomepageTabs from '$ui/HomepageTabs.svelte';
	import Quran from '$svgs/Quran.svelte';
	// import Megaphone from '$svgs/Megaphone.svelte';
	// import Banner from '$ui/FlowbiteSvelte/banner/Banner.svelte';
	import { websiteTagline } from '$data/websiteSettings';
	import { __currentPage, __lastRead, __changelogModalVisible, __timeSpecificChapters, __siteNavigationModalVisible, __quranNavigationModalVisible } from '$utils/stores';
	// import { linkClasses } from '$data/commonClasses';
	// import { websitechangelog } from '$data/changelog';
	import { quranMetaData } from '$data/quranMeta';
	import { term } from '$utils/terminologies';

	import Menu from '$svgs/Menu.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';
	import ContinueReading from '$svgs/ContinueReading.svelte';
	import Moon from '$svgs/Moon.svelte';
	import Cave from '$svgs/Cave.svelte';
	import Search from '$svgs/Search.svelte';

	const topButtonClasses = `inline-flex items-center rounded-full px-4 py-4 space-x-2 justify-center ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const siteDescriptionText = ['Your companion for reading, listening to, and learning the Holy Quran, word by word.', 'With features like word audios, Tajweed colors, and transliteration, delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.'];
	const currentHour = new Date().getHours();

	$: isFriday = new Date().getDay() === 5;
	$: isNight = currentHour < 4 || currentHour > 19;
	$: lastReadExists = $__lastRead.hasOwnProperty('key') && Object.keys($__lastRead.key).length > 0;

	__currentPage.set('home');
</script>

<PageHead title={`Quran ${websiteTagline}`} />

<div class="max-w-5xl mx-auto flex flex-col space-y-4 md:px-4">
	<!-- top menu -->
	<div class="flex flex-col mt-2">
		<div class="w-full flex flex-row justify-between text-sm">
			<div>
				<a href={`/${term('supplications').toLowerCase()}`} class={topButtonClasses}><SupplicationBold size={4} /><span class="hidden md:block">{term('supplications')}</span></a>
				<a href={$__lastRead.hasOwnProperty('page') ? `/page/${$__lastRead.page}` : '/page/1'} class={topButtonClasses}><BookFilled size={4} /><span class="hidden md:block">Mushaf</span></a>
				<a href="/morphology/1:1" class={topButtonClasses}><MorphologyBold size={4} /><span class="hidden md:block">Morphology</span></a>
			</div>
			<button id="homepage-menu-icon" class={topButtonClasses} on:click={() => __siteNavigationModalVisible.set(true)} log-click><Menu size={4} /><span class="hidden md:block">Menu</span></button>
		</div>
	</div>

	<!-- mid section -->
	<div class="flex flex-col mb-4 py-8 px-6 md:px-8 rounded-xl {window.theme('bgSecondaryLight')}">
		<a href="/" class="flex flex-row space-x-4 px-2 items-center justify-left" aria-label="Home">
			<div><Quran /></div>

			<div class="flex flex-col">
				<div id="site-title" class="text-xl md:text-3xl font-bold pb-2" style="color: {window.theme('icon')}">
					<span class="block md:hidden">QuranWBW</span>
					<span class="hidden md:block">Quran Word By Word</span>
				</div>

				<div id="site-description" class="text-sm opacity-70">
					<div class="block md:hidden">{siteDescriptionText[0]}</div>
					<div class="hidden md:block">{siteDescriptionText[0]} {siteDescriptionText[1]}</div>
				</div>
			</div>
		</a>
		<button id="homepage-search-bar" class="mt-8 rounded-full text-center px-4 py-3 flex flex-row items-center justify-center space-x-1 w-full z-10 opacity-10 {window.theme('bgSecondary')}" on:click={() => __quranNavigationModalVisible.set(true)} log-click> ... </button>
		<div class="flex flex-row justify-center mt-[-2.3rem]">
			<span class="mt-[2px] mr-1"><Search size={6} /></span>
			<span class="opacity-70">Navigate or Search Quran</span>
		</div>
	</div>

	<!-- extras: continue reading, time specific chapters -->
	<div class="flex flex-col mt-4 text-sm">
		<div class="w-full flex flex-row space-x-4 items-center">
			<div class="flex flex-row space-x-2 w-full">
				{#if lastReadExists}
					{@const [lastReadChapter, lastReadVerse] = $__lastRead.key.split(':').map(Number)}
					<a id="continue-last-read-button" href="/{lastReadChapter}/{lastReadVerse}" class="{topButtonClasses} truncate w-full" log-click>
						<span><ContinueReading size={4} /></span>
						<span class="hidden md:block">
							Continue Reading:
							{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}
						</span>
						<span class="block md:hidden">
							{#if !isFriday && !isNight}
								Continue:
								{quranMetaData[lastReadChapter].transliteration}, {lastReadChapter}:{lastReadVerse}
							{:else if (isFriday || isNight) && !(isFriday && isNight)}
								Continue:
								{lastReadChapter}:{lastReadVerse}
							{:else}
								{lastReadChapter}:{lastReadVerse}
							{/if}
						</span>
					</a>
				{/if}

				{#if isFriday || isNight}
					{#if isFriday}
						<a id="surah-kahf-reminder-button" href="/18" class="{topButtonClasses} truncate w-full" log-click>
							<span class="-mt-1"><Cave size={4} /></span>
							<div class="flex flex-row">
								<span class="hidden md:block mr-1">Friday Reminder:</span>
								<span>Al-Kahf</span>
							</div>
						</a>
					{/if}

					{#if isNight}
						<a id="surah-mulk-reminder-button" href="/67" class="{topButtonClasses} truncate w-full" log-click>
							<span><Moon size={4} /></span>
							<div class="flex flex-row">
								<span class="hidden md:block mr-1">Night Reminder:</span>
								<span>Al-Mulk</span>
							</div>
						</a>
					{/if}
				{/if}
			</div>
		</div>
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
