<script>
	export let page;

	import Dropdown from '$ui/FlowbiteSvelte/dropdown/Dropdown.svelte';
	import DropdownItem from '$ui/FlowbiteSvelte/dropdown/DropdownItem.svelte';
	import Play from '$svgs/Play.svelte';
	import Bookmark from '$svgs/Bookmark.svelte';
	import BookmarkFilled from '$svgs/BookmarkFilled.svelte';
	import Notes from '$svgs/Notes.svelte';
	import NotesFilled from '$svgs/NotesFilled.svelte';
	import Tafsir from '$svgs/Tafsir.svelte';
	import VerseTranslation from '$svgs/VerseTranslation.svelte';
	import ChapterMode from '$svgs/ChapterMode.svelte';
	import Book from '$svgs/Book.svelte';
	import Morphology from '$svgs/Morphology.svelte';
	import Copy from '$svgs/Copy.svelte';
	import Trash from '$svgs/Trash.svelte';
	import { showAudioModal } from '$utils/audioController';
	import { selectableDisplays } from '$data/options';
	import { __userSettings, __verseKey, __notesModalVisible, __tafsirModalVisible, __morphologyModalVisible, __verseTranslationModalVisible, __copyShareVerseModalVisible, __currentPage, __displayType, __userNotes, __fontType, __morphologyKey, __userColoredBookmarks, __websiteTheme } from '$utils/stores';
	import { updateSettings } from '$utils/updateSettings';
	import { term } from '$utils/terminologies';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { checkOnlineAndAlert } from '$utils/offlineModeHandler';
	import { COLOR_TOKENS, isDarkTheme } from '$utils/coloredBookmarks';

	// Constants
	const mushafFontTypes = [2, 3];
	const dropdownItemClasses = 'flex flex-row items-center space-x-2 font-normal rounded-3xl hover:bg-theme-accent/5';

	// Component state
	let dropdownOpen = false;
	let subMenuVisible = false;
	let storageError = '';

	// Computed values
	$: [chapter, verse] = $__verseKey.split(':').map(Number);
	$: userBookmarks = JSON.parse($__userSettings).userBookmarks;
	$: isBookmarked = userBookmarks.includes($__verseKey);
	$: hasNotes = Object.prototype.hasOwnProperty.call($__userNotes, $__verseKey);
	$: currentColorId = (() => {
		try {
			const map = $__userColoredBookmarks ?? {};
			const v = map[$__verseKey];
			const n = Number(v);
			return Number.isInteger(n) && n >= 1 && n <= 8 ? n : null;
		} catch {
			return null;
		}
	})();
	$: currentColorToken = currentColorId ? COLOR_TOKENS[currentColorId] : null;
	$: currentColorName = currentColorToken ? currentColorToken.name : null;
	$: isDark = isDarkTheme($__websiteTheme);

	function focusTrigger() {
		try {
			const el = document.getElementById(`verse-options-${verse}`);
			el?.focus();
		} catch (_e) {
			// ignore focus error
		}
	}

	// Event handlers
	const handleAdvancedPlay = async () => {
		if (!(await checkOnlineAndAlert())) return;
		showAudioModal($__verseKey);
		dropdownOpen = false;
	};

	const handleBookmark = () => {
		updateSettings({ type: 'userBookmarks', key: $__verseKey, set: true });
	};

	const handleNotes = () => {
		__notesModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleTranslation = () => {
		__verseTranslationModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleTafsir = () => {
		__tafsirModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleMorphology = () => {
		__morphologyKey.set($__verseKey);
		__morphologyModalVisible.set(true);
		dropdownOpen = false;
	};

	const handleCopy = async () => {
		if (!(await checkOnlineAndAlert())) return;
		__copyShareVerseModalVisible.set(true);
		dropdownOpen = false;
	};

	const openColoredSubmenu = (event) => {
		event?.preventDefault?.();
		event?.stopPropagation?.();
		storageError = '';
		subMenuVisible = true;
		dropdownOpen = true;
		// Keep focus inside Popper floatingEl so activeContent hideHandler (100ms hasFocus check) does not close.
		// The clicked row is removed from DOM when submenu appears, so activeElement would become body without this.
		setTimeout(() => {
			try {
				const el = document.querySelector('[aria-label="Bookmark colors"]');
				if (el instanceof HTMLElement) el.focus();
				else {
					const first = document.querySelector('[role="menuitemradio"]');
					if (first instanceof HTMLElement) first.focus();
				}
			} catch (_e) {
				// ignore focus error
			}
		}, 0);
	};

	const closeSubMenu = (event) => {
		event?.preventDefault?.();
		event?.stopPropagation?.();
		subMenuVisible = false;
		storageError = '';
		dropdownOpen = true;
		// Return focus inside dropdown so hideHandler does not close; next submenu open will be via Colored Bookmark row.
		setTimeout(() => {
			try {
				const btn = document.querySelector('[aria-label*="Colored Bookmark"]');
				if (btn instanceof HTMLElement) btn.focus();
			} catch (_e) {
				// ignore focus error
			}
		}, 0);
	};

	const handleSelectColor = (colorId) => {
		storageError = '';
		const verseKey = $__verseKey;
		// idempotent no-op
		if (currentColorId === colorId) {
			dropdownOpen = false;
			subMenuVisible = false;
			setTimeout(() => {
				focusTrigger();
				// Popper's trigger focusin would reopen dropdown (open=true on focusin); ensure it stays closed
				setTimeout(() => (dropdownOpen = false), 0);
			}, 0);
			return;
		}
		const res = updateSettings({ type: 'userColoredBookmarks', key: verseKey, colorId });
		if (res && !res.ok) {
			if (res.status === 507 || res.status === 400 || res.status === 500) {
				storageError = res.error?.message ?? 'Couldn’t save';
				return;
			}
		}
		dropdownOpen = false;
		subMenuVisible = false;
		// success announced via tint; polite live not needed visual
		// Focus trigger for a11y but suppress Popper focusin reopen (focusin sets open=true)
		setTimeout(() => {
			focusTrigger();
			setTimeout(() => (dropdownOpen = false), 0);
		}, 0);
	};

	const handleClearColor = () => {
		if (!currentColorId) return;
		storageError = '';
		const verseKey = $__verseKey;
		const res = updateSettings({ type: 'userColoredBookmarks', key: verseKey, clear: true });
		if (res && !res.ok) {
			storageError = res.error?.message ?? 'Couldn’t save';
			return;
		}
		dropdownOpen = false;
		subMenuVisible = false;
		setTimeout(() => {
			focusTrigger();
			setTimeout(() => (dropdownOpen = false), 0);
		}, 0);
	};

	const handleSubmenuKeydown = (e) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closeSubMenu(e);
		}
	};

	// Track analytics
	const trackEvent = (eventName) => {
		window.umami.track(eventName);
	};

	// Reset submenu when dropdown closes
	$: if (!dropdownOpen) {
		subMenuVisible = false;
		storageError = '';
	}

	// Menu items configuration (without colored — colored rendered as dedicated row beneath play)
	$: menuItems = [
		{
			id: 'play',
			icon: Play,
			text: 'Advanced Play',
			handler: handleAdvancedPlay,
			analyticsEvent: 'Advanced Play Modal Button',
			show: true
		},
		{
			id: 'bookmark',
			icon: isBookmarked ? BookmarkFilled : Bookmark,
			text: isBookmarked ? 'Unbookmark' : 'Bookmark',
			handler: handleBookmark,
			analyticsEvent: 'Bookmark Verse Button',
			show: true
		},
		{
			id: 'notes',
			icon: hasNotes ? NotesFilled : Notes,
			text: 'Notes',
			handler: handleNotes,
			analyticsEvent: 'Verse Notes Modal Button',
			show: true
		},
		{
			id: 'translation',
			icon: VerseTranslation,
			text: 'Translation',
			handler: handleTranslation,
			analyticsEvent: 'Verse Translation Modal Button',
			show: selectableDisplays[$__displayType].continuous
		},
		{
			id: 'tafsir',
			icon: Tafsir,
			text: term('tafsir'),
			handler: handleTafsir,
			analyticsEvent: 'Verse Tafsir Modal Button',
			show: true
		},
		{
			id: 'morphology',
			icon: Morphology,
			text: 'Morphology',
			handler: handleMorphology,
			analyticsEvent: 'Verse Morphology Modal Button',
			show: true
		},
		{
			id: 'copy',
			icon: Copy,
			text: 'Copy',
			handler: handleCopy,
			analyticsEvent: 'Copy Verse Modal Button',
			show: !mushafFontTypes.includes($__fontType)
		}
	];

	// Mode switching items
	$: modeItems =
		$__currentPage === 'mushaf'
			? [
					{
						href: `/${chapter}?startVerse=${verse}`,
						icon: ChapterMode,
						text: `${term('chapter')} Mode`,
						analyticsEvent: 'Chapter Mode Button'
					}
				]
			: [
					{
						href: `/page?id=${page}`,
						icon: Book,
						text: 'Mushaf Mode',
						analyticsEvent: 'Mushaf Mode Button'
					}
				];

	// For roving tabindex grid, computed ordered ids 1..8
	const colorIds = [1, 2, 3, 4, 5, 6, 7, 8];
</script>

<Dropdown bind:open={dropdownOpen} activeContent class="px-2 mr-2 my-2 w-max text-left font-sans direction-ltr">
	<div class="py-2 px-4 text-xs font-semibold text-left">
		{term('verse')}
		{$__verseKey}
	</div>

	{#if !subMenuVisible}
		<div transition:fly={{ duration: 0, x: 0, easing: sineIn }}>
			<!-- Play row -->
			{#each menuItems as item (item.id)}
				{#if item.id === 'play' && item.show}
					<DropdownItem class={dropdownItemClasses} on:click={item.handler} data-umami-event={item.analyticsEvent}>
						<svelte:component this={item.icon} />
						<span>{item.text}</span>
					</DropdownItem>
					<!-- Colored Bookmark row inserted immediately beneath Advanced Play -->
					<button
						class="{dropdownItemClasses} w-full text-left px-4 py-2 flex flex-row items-center justify-between"
						on:click|stopPropagation|preventDefault={openColoredSubmenu}
						role="menuitem"
						aria-haspopup="menu"
						aria-expanded="false"
						aria-label={currentColorName ? `Colored Bookmark, Current: ${currentColorName}` : 'Colored Bookmark'}
						data-umami-event="Colored Bookmark Menu"
					>
						<span class="flex flex-row items-center space-x-2">
							<!-- palette icon (simple dot grid) -->
							<span class="w-4 h-4 rounded-full grid grid-cols-2 gap-[1px] p-0.5 border border-theme-accent/20 overflow-hidden" aria-hidden="true">
								<span class="bg-[#EADDB8] rounded-[1px]"></span><span class="bg-[#B9973F] rounded-[1px]"></span><span class="bg-[#DDD4E8] rounded-[1px]"></span><span class="bg-[#8FA67A] rounded-[1px]"></span>
							</span>
							<span>Colored Bookmark</span>
						</span>
						<span class="flex flex-row items-center space-x-2">
							{#if currentColorId}
								<span
									class="w-3 h-3 rounded-full border border-theme-accent/20"
									style="background-color: {isDark ? COLOR_TOKENS[currentColorId].darkHex : COLOR_TOKENS[currentColorId].lightHex}"
									aria-hidden="true"
								></span>
							{/if}
							<span aria-hidden="true" class="opacity-60">›</span>
						</span>
					</button>
				{:else if item.id !== 'play' && item.show}
					<DropdownItem class={dropdownItemClasses} on:click={item.handler} data-umami-event={item.analyticsEvent}>
						<svelte:component this={item.icon} />
						<span>{item.text}</span>
					</DropdownItem>
				{/if}
			{/each}

			<!-- Mode switching items -->
			{#each modeItems as item}
				<DropdownItem class={dropdownItemClasses} href={item.href} on:click={() => trackEvent(item.analyticsEvent)}>
					<svelte:component this={item.icon} />
					<span>{item.text}</span>
				</DropdownItem>
			{/each}
		</div>
	{:else}
		<div transition:fly={{ duration: 150, x: 8, easing: sineIn }} role="menu" tabindex="-1" aria-label="Bookmark colors" on:keydown={handleSubmenuKeydown} class="w-56 md:w-64 p-3">
			<button
				class="flex items-center space-x-1 text-xs font-medium opacity-70 hover:opacity-100 mb-2 px-1 py-1 rounded-3xl hover:bg-theme-accent/5 focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 focus-visible:outline-none"
				on:click|stopPropagation|preventDefault={closeSubMenu}
				aria-label="Back to verse options"
			>
				<span aria-hidden="true">‹</span><span>Back</span>
			</button>

			<div class="px-1 pb-2 text-xs font-semibold opacity-70">8 colors</div>

			<div class="grid grid-cols-4 gap-2" role="group" aria-label="Bookmark colors">
				{#each colorIds as id}
					{@const token = COLOR_TOKENS[id]}
					{@const isSelected = currentColorId === id}
					{@const bg = isDark ? token.darkHex : token.lightHex}
					<button
						role="menuitemradio"
						aria-checked={isSelected}
						aria-label="Set {token.name} (color {id})"
						title={token.name}
						tabindex={isSelected || (!currentColorId && id === 1) ? 0 : -1}
						class="w-7 h-7 md:w-7 md:h-7 rounded-full border flex items-center justify-center transition-all duration-150 hover:scale-105 hover:brightness-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg focus:outline-none {isSelected
							? 'ring-2 ring-theme-accent ring-offset-2 ring-offset-theme-bg border-transparent'
							: 'border-theme-accent/20 hover:border-theme-accent/40'}"
						style="background-color: {bg}"
						on:click|stopPropagation|preventDefault={() => handleSelectColor(id)}
					>
						{#if isSelected}
							<span aria-hidden="true" class="text-[10px] font-bold" style="color: {isDark ? '#fff' : '#000'}; text-shadow: 0 0 2px rgba(0,0,0,0.2)">✓</span>
						{/if}
					</button>
				{/each}
			</div>

			<button
				role="menuitem"
				aria-disabled={!currentColorId}
				disabled={!currentColorId}
				class="mt-3 w-full flex flex-row items-center justify-center space-x-2 text-xs px-3 py-2 rounded-3xl border border-transparent hover:bg-theme-accent/5 focus-visible:ring-2 focus-visible:ring-theme-accent focus:outline-none {currentColorId
					? 'opacity-100'
					: 'opacity-40 cursor-not-allowed pointer-events-none'}"
				on:click|stopPropagation|preventDefault={handleClearColor}
			>
				<Trash size={3} aria-hidden="true" />
				<span>Clear color</span>
			</button>

			{#if storageError}
				<div role="alert" aria-live="assertive" class="mt-2 text-xs text-red-600 px-2">{storageError}</div>
			{/if}
			<div aria-live="polite" class="sr-only">{currentColorName ? `Color ${currentColorName} saved` : ''}</div>
		</div>
	{/if}
</Dropdown>

<style>
	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			transition: none !important;
		}
	}
</style>
