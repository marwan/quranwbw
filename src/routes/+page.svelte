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
	// import { fetchChapterData } from '$utils/fetchData';
	import Menu from '$svgs/Menu.svelte';
	import SupplicationBold from '$svgs/SupplicationBold.svelte';
	import MorphologyBold from '$svgs/MorphologyBold.svelte';
	import BookFilled from '$svgs/BookFilled.svelte';
	import Search from '$svgs/Search.svelte';

	const topButtonClasses = `inline-flex items-center rounded-full px-4 py-2 space-x-2 justify-center ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const siteDescriptionText = ['Your companion for reading, listening to, and learning the Holy Quran, word by word.', 'With features like word audios, Tajweed colors, and transliteration, delve into the Quran with ease. Additionally, explore multi-language translations, tafsir, and detailed word morphology.'];
	const currentHour = new Date().getHours();

	$: isFriday = new Date().getDay() === 5 && currentHour < 18;
	$: isNight = currentHour < 4 || currentHour > 18;

	// let chaptersFetched = false;

	// // Check if the user is on a 4G connection
	// function isOn4G() {
	// 	if ('connection' in navigator) {
	// 		const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	// 		return connection.effectiveType === '4g';
	// 	}
	// 	return false; // Assume not on 4G if the API is unavailable
	// }

	// // Fetch chapters data once the scroll starts and the user is on 4G
	// window.addEventListener('scroll', () => {
	// 	if (!chaptersFetched && window.scrollY > 200 && isOn4G()) {
	// 		chaptersFetched = true;

	// 		for (let chapter = 1; chapter <= 114; chapter++) {
	// 			fetchChapterData({ chapter, skipSave: true });
	// 		}
	// 	}
	// });

	__currentPage.set('home');
</script>

<PageHead title={`Quran ${websiteTagline}`} />

<div class="max-w-5xl mx-auto flex flex-col space-y-4 md:px-4">
	<!-- top menu -->
	<div class="flex flex-col mt-2">
		<div class="w-full flex flex-row justify-between text-sm">
			<div>
				<a href={`/${term('supplications').toLowerCase()}`} class="{topButtonClasses} !py-4 md:bg-transparent"><SupplicationBold size={4} /><span class="hidden md:block">{term('supplications')}</span></a>
				<a href={$__lastRead.hasOwnProperty('page') ? `/page/${$__lastRead.page}` : '/page/1'} class="{topButtonClasses} !py-4 md:bg-transparent"><BookFilled size={4} /><span class="hidden md:block">Mushaf</span></a>
				<a href="/morphology/1:1" class="{topButtonClasses} !py-4 md:bg-transparent"><MorphologyBold size={4} /><span class="hidden md:block">Morphology</span></a>
			</div>
			<button class={topButtonClasses} on:click={() => __siteNavigationModalVisible.set(true)}><Menu size={4} /><span class="hidden md:block">Menu</span></button>
		</div>
	</div>

	<!-- mid section -->
	<div class="flex flex-col mb-4 py-8 px-6 md:px-8 rounded-xl !mt-2 {window.theme('bgSecondaryLight')}">
		<a href="/" class="flex flex-row space-x-4 px-2 items-center justify-left" aria-label="Home">
			<div><Quran /></div>

			<div class="flex flex-col">
				<div id="site-title" class="text-2xl md:text-3xl font-bold pb-2" style="color: {window.theme('icon')}">
					<span class="block md:hidden">QuranWBW</span>
					<span class="hidden md:block">Quran Word By Word</span>
				</div>

				<div id="site-description" class="text-sm opacity-70">
					<div class="block md:hidden">{siteDescriptionText[0]}</div>
					<div class="hidden md:block">{siteDescriptionText[0]} {siteDescriptionText[1]}</div>
				</div>
			</div>
		</a>
		<button class="mt-8 rounded-full text-center px-4 py-3 flex flex-row items-center justify-center space-x-1 w-full z-10 {window.theme('bgSecondaryDark')}" on:click={() => __quranNavigationModalVisible.set(true)} data-umami-event="Homepage Search Bar">
			<div class="flex flex-row justify-center truncate">
				<span class="mt-[2px] mr-1"><Search size={6} /></span>
				<span class="opacity-70 truncate">Navigate or Search Quran</span>
			</div>
		</button>
	</div>

	<!-- extras: continue reading, time specific chapters -->
	{#if isFriday || isNight}
		<div class="flex flex-col mt-4 text-sm">
			<div class="w-full flex flex-row space-x-4 items-center">
				<div class="flex flex-row space-x-2 w-full">
					{#if isFriday}
						<a href="/18" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Kahf Reminder Button')}>
							<span class="invisible chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[18].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Friday Reminder:</span>
								<span>Al Kahf</span>
							</div>
						</a>
					{/if}

					{#if isNight}
						<a href="/56" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Waaqia Reminder Button')}>
							<span class="invisible chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[56].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Evening Reminder:</span>
								<span>Al Waaqia</span>
							</div>
						</a>

						<a href="/67" class="{topButtonClasses} truncate w-full" on:click={() => window.umami.track('Al-Mulk Reminder Button')}>
							<span class="invisible chapter-icons mb-1 text-2xl md:text-3xl" style="color: {window.theme('icon')}">{@html `&#xE9${quranMetaData[67].icon};`}</span>
							<div class="flex flex-row truncate">
								<span class="hidden md:block mr-1">Night Reminder:</span>
								<span>Al Mulk</span>
							</div>
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}

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
