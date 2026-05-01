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
	import BackupRestore from '$svgs/BackupRestore.svelte';
	import LeftArrow from '$svgs/LeftArrow.svelte';
	import { disabledClasses } from '$data/commonClasses';
	import { __siteNavigationModalVisible, __settingsDrawerHidden, __tajweedRulesModalVisible, __currentPage } from '$utils/stores';
	import { term } from '$utils/terminologies';
	import { getModalTransition } from '$utils/getModalTransition';
	import { isUserOnline } from '$utils/offlineModeHandler';

	const linkClasses = 'w-full flex flex-row space-x-3 py-4 px-4 rounded-xl items-center cursor-pointer border border-transparent hover:border-theme-accent bg-theme-accent/5';
	const linkTextClasses = 'text-sm text-left w-[-webkit-fill-available] truncate';

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

<Modal id="siteNavigationModal" bind:open={$__siteNavigationModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 id="modal-title" class="mb-6 text-xl font-medium flex-shrink-0">Navigate</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
			<!-- Search -->
			<a href="/search" class={`${linkClasses} ${!userOnline && disabledClasses}`} aria-disabled={!userOnline} tabindex={userOnline ? undefined : -1}>
				<span><Search2 /></span>
				<span class={linkTextClasses}>Search</span>
			</a>

			<!-- Settings -->
			<button
				on:click={() => {
					__siteNavigationModalVisible.set(false);
					__settingsDrawerHidden.set(false);
				}}
				class={linkClasses}
			>
				<span><Settings /></span>
				<span class={linkTextClasses}>Settings</span>
			</button>

			<!-- Topics -->
			<a href="/topics" class={linkClasses}>
				<span><Topics /></span>
				<span class={linkTextClasses}>Topics</span>
			</a>

			<!-- Bookmarks -->
			<a href="/bookmarks" class={linkClasses}>
				<span><Bookmark /></span>
				<span class={linkTextClasses}>Bookmarks</span>
			</a>

			<!-- Tajweed Rules -->
			<button
				on:click={() => {
					__siteNavigationModalVisible.set(false);
					__tajweedRulesModalVisible.set(true);
				}}
				class={linkClasses}
				data-umami-event="Tajweed Modal Button"
			>
				<span><TajweedRules /></span>
				<span class={linkTextClasses}>{term('tajweed')} Rules</span>
			</button>

			<!-- Supplications -->
			<a href="/{term('supplications').toLowerCase()}" class={linkClasses}>
				<span><Supplication /></span>
				<span class={linkTextClasses}>{term('supplications')}</span>
			</a>

			<!-- Morphology -->
			<a href="/morphology?word=1:1:1" class={linkClasses}>
				<span><Morphology /></span>
				<span class={linkTextClasses}>Morphology</span>
			</a>

			<!-- Guess The Word -->
			<a href="/games/guess-the-word" class={linkClasses}>
				<span><Puzzle /></span>
				<span class={linkTextClasses}>Word Game</span>
			</a>

			<!-- Changelog -->
			<a href="/changelog" class={linkClasses}>
				<span><Changelog /></span>
				<span class={linkTextClasses}>Changelog</span>
			</a>

			<!-- About -->
			<a href="/about" class={linkClasses}>
				<span><About /></span>
				<span class={linkTextClasses}>About</span>
			</a>

			<!-- Offline Mode -->
			<a href="/offline" class={linkClasses}>
				<span><Offline /></span>
				<span class={linkTextClasses}>Offline Mode (Beta)</span>
			</a>

			<!-- Backup & Restore -->
			<a href="/backup" class={linkClasses}>
				<span><BackupRestore /></span>
				<span class={linkTextClasses}>Backup & Restore (Beta)</span>
			</a>

			<!-- Old Website -->
			<a href="https://old.quranwbw.com/" target="_blank" rel="noopener noreferrer" class={`${linkClasses} ${!userOnline && disabledClasses}`} aria-disabled={!userOnline} tabindex={userOnline ? undefined : -1} data-umami-event="Legacy Site Button">
				<span><LeftArrow /></span>
				<span class={linkTextClasses}>Old Website</span>
			</a>
		</div>
	</div>
</Modal>
