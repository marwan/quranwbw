<script>
	import Drawer from '$ui/FlowbiteSvelte/drawer/Drawer.svelte';
	import { __menuDrawerHidden, __siteNavigationModalVisible, __settingsDrawerHidden, __tajweedRulesModalVisible, __currentPage } from '$utils/stores';
	// import { sineIn } from 'svelte/easing';

	import Settings from '$svgs/Settings.svelte';
	import TajweedRules from '$svgs/TajweedRules.svelte';
	import Supplication from '$svgs/Supplication.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Puzzle from '$svgs/Puzzle.svelte';
	import About from '$svgs/About.svelte';
	import Changelog from '$svgs/Changelog.svelte';
	import LegacySite from '$svgs/LegacySite.svelte';

	import { term } from '$utils/terminologies';

	import CloseButton from '$ui/FlowbiteSvelte/utils/CloseButton.svelte';

	// Transition parameters for drawer
	const transitionParamsRight = {
		// x: 320,
		// duration: 200,
		// easing: sineIn
	};

	const linkClasses = `w-full flex flex-row space-x-2 py-4 px-4 rounded-xl items-center cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const linkTextClasses = 'text-xs md:text-sm text-left w-[-webkit-fill-available] truncate';

	let settingsDrawerOpacity = 'opacity-100';
	let settingsDrawerBackground = `${window.theme('bgMain')}`;
</script>

<!-- menu drawer -->
<Drawer placement="left" transitionType="fly" transitionParams={transitionParamsRight} bind:hidden={$__menuDrawerHidden} class="w-full md:w-1/2 lg:w-[430px] md:rounded-tr-3xl md:rounded-br-3xl pt-0 {settingsDrawerBackground}" id="menu-drawer">
	<div class="flex z-30 top-0 sticky {window.theme('bgMain')} border-b-2 {window.theme('border')} mb-4 {settingsDrawerOpacity}">
		<h5 id="drawer-label" class="inline-flex items-center my-4 text-3xl font-semibold">Menu</h5>
		<CloseButton on:click={() => ($__menuDrawerHidden = true)} class="my-4 rounded-3xl" />
	</div>

	<div class="flex flex-col space-y-4 my-4">
		<!-- Search -->
		<a href="/search" class={linkClasses}>
			<Search2 size={4} />
			<span class={linkTextClasses}>Search</span>
		</a>

		<!-- settings modal -->
		<button
			on:click={() => {
				__siteNavigationModalVisible.set(false);
				__settingsDrawerHidden.set(false);
			}}
			class={linkClasses}
		>
			<Settings size={4} />
			<span class={linkTextClasses}>Settings</span>
		</button>

		<!-- Bookmarks -->
		<a href="/bookmarks" class={linkClasses}>
			<Bookmark size={4} />
			<span class={linkTextClasses}>Bookmarks</span>
		</a>

		<!-- tajweed rules modal -->
		<button
			on:click={() => {
				__siteNavigationModalVisible.set(false);
				__tajweedRulesModalVisible.set(true);
			}}
			class={linkClasses}
			data-umami-event="Tajweed Modal Button"
		>
			<TajweedRules size={4} />
			<span class={linkTextClasses}>{term('tajweed')} Rules</span>
		</button>

		<!-- Supplications -->
		<a href="/{term('supplications').toLowerCase()}" class={linkClasses}>
			<Supplication size={4} />
			<span class={linkTextClasses}>{term('supplications')}</span>
		</a>

		<!-- Morphology -->
		<a href="/morphology?word=1:1:1" class={linkClasses}>
			<Morphology size={4} />
			<span class={linkTextClasses}>Morphology</span>
		</a>

		<!-- Guess The Word -->
		<a href="/games/guess-the-word" class={linkClasses}>
			<Puzzle size={4} />
			<span class={linkTextClasses}>Word Game</span>
		</a>

		<!-- changelog -->
		<a href="/changelog" class={linkClasses}>
			<Changelog size={4} />
			<span class={linkTextClasses}>Changelog</span>
		</a>

		<!-- legacy site link -->
		<a href="https://old.quranwbw.com/" target="_blank" class={linkClasses} data-umami-event="Legacy Site Button">
			<LegacySite size={4} />
			<span class={linkTextClasses}>Old Website</span>
		</a>

		<!-- About -->
		<a href="/about" class={linkClasses}>
			<About size={4} />
			<span class={linkTextClasses}>About</span>
		</a>

		<!-- download modal -->
		<!-- <button
					on:click={() => {
						__siteNavigationModalVisible.set(false);
						__downloadModalVisible.set(true);
					}}
					class={linkClasses}
				>
					<span class={linkTextClasses}>Offline Mode</span>
				</button> -->
	</div>
</Drawer>
