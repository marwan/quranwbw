<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
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
	import Info from '$svgs/Info.svelte';
	import { __siteNavigationModalVisible, __settingsDrawerHidden, __tajweedRulesModalVisible, __currentPage } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';

	const linkClasses = `w-full flex flex-row space-x-2 py-4 px-4 rounded-xl items-center cursor-pointer ${window.theme('hoverBorder')} ${window.theme('bgSecondaryLight')}`;
	const linkTextClasses = 'text-xs md:text-sm text-left w-[-webkit-fill-available] truncate';

	// hide the modal when page changes
	$: if ($__currentPage) __siteNavigationModalVisible.set(false);
</script>

<Modal id="siteNavigationModal" bind:open={$__siteNavigationModalVisible} transitionParams={getModalTransition('basic')} size="xs" class="rounded-3xl" bodyClass="p-6" center outsideclose>
	<div class="flex flex-col space-y-4">
		<!-- modals / popups -->
		<div class="flex flex-col space-y-2">
			<div class="font-semibold">Navigate</div>
			<div class="grid grid-cols-2 md:grid-cols-2 gap-1">
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

				<!-- Offline -->
				<a href="/offline" class={linkClasses}>
					<Info size={4} />
					<span class={linkTextClasses}>Offline</span>
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
		</div>
	</div>
</Modal>
