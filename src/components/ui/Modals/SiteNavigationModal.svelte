<script>
	import { onMount } from 'svelte';
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import Settings from '$svgs/Settings.svelte';
	import Topics from '$svgs/Topics.svelte';
	import TajweedRules from '$svgs/TajweedRules.svelte';
	import Supplication from '$svgs/Supplication.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import Search2 from '$svgs/Search2.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Puzzle from '$svgs/Puzzle.svelte';
	import About from '$svgs/About.svelte';
	import Changelog from '$svgs/Changelog.svelte';
	import Offline from '$svgs/Offline.svelte';
	import LegacySite from '$svgs/LegacySite.svelte';
	import { disabledClasses } from '$data/commonClasses';
	import { __siteNavigationModalVisible, __settingsDrawerHidden, __tajweedRulesModalVisible, __currentPage } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { isUserOnline } from '$utils/offlineModeHandler';

	const linkClasses = 'w-full flex flex-row space-x-2 py-4 px-4 rounded-xl items-center cursor-pointer border border-transparent hover:border-theme-accent bg-theme-accent/5';
	const linkTextClasses = 'text-xs md:text-sm text-left w-[-webkit-fill-available] truncate';

	// Default to online; fall back gracefully if navigator is unavailable (e.g. SSR)
	let userOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

	// Performs a real network check (not just navigator.onLine) via the utility
	async function checkNetwork() {
		userOnline = await isUserOnline();
	}

	onMount(() => {
		// Keep userOnline in sync with browser online/offline events
		const syncOnlineStatus = () => {
			userOnline = navigator.onLine;
		};

		window.addEventListener('online', syncOnlineStatus);
		window.addEventListener('offline', syncOnlineStatus);

		// Run an actual connectivity check on mount
		checkNetwork();

		// Cleanup listeners when the component is destroyed
		return () => {
			window.removeEventListener('online', syncOnlineStatus);
			window.removeEventListener('offline', syncOnlineStatus);
		};
	});

	// Re-check network each time the navigation modal opens, so offline-gated tiles reflect the latest status without re-rendering the layout
	$: if ($__siteNavigationModalVisible) checkNetwork();

	// Automatically close the navigation modal whenever the user navigates to a new page
	$: if ($__currentPage) __siteNavigationModalVisible.set(false);
</script>

<Modal id="siteNavigationModal" bind:open={$__siteNavigationModalVisible} transitionParams={getModalTransition('basic')} size="xs" class="rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" center outsideclose>
	<h3 id="modal-title" class="mb-2 text-md font-semibold flex-shrink-0">Navigate</h3>

	<div class="flex-1 min-h-0 overflow-y-auto">
		<div class="flex flex-col space-y-4">
			<!-- modals / popups -->
			<div class="flex flex-col space-y-2">
				<div class="grid grid-cols-2 md:grid-cols-2 gap-1">
					<!-- Search -->
					<a href="/search" class={`${linkClasses} ${!userOnline && disabledClasses}`} aria-disabled={!userOnline} tabindex={userOnline ? undefined : -1}>
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

					<!-- topics page link -->
					<a href="/topics" class={linkClasses}>
						<Topics size={4} />
						<span class={linkTextClasses}>Topics</span>
					</a>

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

					<!-- About -->
					<a href="/about" class={linkClasses}>
						<About size={4} />
						<span class={linkTextClasses}>About</span>
					</a>

					<!-- Offline Mode page -->
					<a href="/offline" class={linkClasses}>
						<Offline size={4} />
						<span class={linkTextClasses}>Offline Mode (Beta)</span>
					</a>

					<!-- legacy site link -->
					<a href="https://old.quranwbw.com/" target="_blank" rel="noopener noreferrer" class={`${linkClasses} ${!userOnline && disabledClasses}`} aria-disabled={!userOnline} tabindex={userOnline ? undefined : -1} data-umami-event="Legacy Site Button">
						<LegacySite size={4} />
						<span class={linkTextClasses}>Old Website</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</Modal>
