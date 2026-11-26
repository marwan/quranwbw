# DESIGN_AND_CODE_PRINCIPLES.md

Rulebook for AI assistants designing or implementing features in the QuranWBW codebase. All rules below are derived strictly from the existing source files.

---

## 1. Tech Stack & Versions

> Note: `package.json`, `tailwind.config.js`, `svelte.config.js`, and `src/app.css` were not included in the attached source bundle; exact package version numbers are therefore omitted.

| Layer                          | Technology / Library                                                                              | Usage in Codebase                                                                                                                                                                                                                                                              |
| :----------------------------- | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**                  | Svelte + SvelteKit                                                                                | Svelte 4 syntax (`export let`, `$:`, `on:*`, `<svelte:component>`, `<svelte:self>`, `createEventDispatcher`), SvelteKit file routing (`+layout.svelte`, `+page.svelte`, `+page.js`, `+error.svelte`), `$app/stores`, `$app/navigation`, `$app/environment`, `$service-worker`. |
| **Styling**                    | Tailwind CSS                                                                                      | Utility-first styling, custom theme color tokens (`theme-bg`, `theme-accent`, `theme-text`), responsive prefixes (`md:`, `lg:`), arbitrary values, print modifiers (`print:hidden`, `print:break-inside-avoid`).                                                               |
| **UI Kit**                     | Local FlowbiteSvelte (`$ui/FlowbiteSvelte/*`)                                                     | Vendored components: `Modal`, `Drawer`, `Dropdown`, `DropdownItem`, `Radio`, `Checkbox`, `Input`, `Range`, `Tooltip`, `CloseButton`, `Skeleton`.                                                                                                                               |
| **Transitions & Observers**    | `svelte/transition`, `svelte/easing`, `svelte-inview`, `svelte-portal`                            | `fade`, `fly`, `sineIn`; `use:inview` for infinite scroll & reading position tracking; `<Portal target="body">` for dropdowns inside scrollable/clipped cards.                                                                                                                 |
| **Data & Offline Storage**     | IndexedDB via Dexie (`$utils/dexie`), Cache API, Service Worker, `localStorage`, `sessionStorage` | JSON data cached in IndexedDB (`cacheTableMap`, `clearDexieTable`); static assets/audio cached in Cache API (`quranwbw-*` caches); user preferences persisted in `localStorage.userSettings`.                                                                                  |
| **Markdown**                   | `marked`                                                                                          | Parses `?raw` imported `.md` files (`ABOUT.md?raw`, `CHANGELOG.md?raw`, `PRIVACY.md?raw`) inside `<div class="markdown mx-auto">`.                                                                                                                                             |
| **Testing**                    | Vitest + `@testing-library/svelte`                                                                | Co-located unit/component tests (`*.test.js`) using `vi.mock`, `render`, `fireEvent`, `screen`.                                                                                                                                                                                |
| **Analytics & Error Tracking** | Rybbit (`window.rybbit`)                                                                          | Loaded conditionally in `app.html` unless `localStorage['disable-rybbit'] === 'true'`; tracked via `window.rybbit?.event(...)`, `data-rybbit-event="..."`, and `window.rybbit?.error(error)`.                                                                                  |
| **Build Constants & Env**      | `__APP_VERSION__`, `import.meta.env.VITE_KALIMAT_PUBLIC_API_KEY`                                  | Git/build version injected into `__APP_VERSION__`; public search API key read via Vite env.                                                                                                                                                                                    |

---

## 2. Project Structure

Follow the existing directory layout and SvelteKit path aliases:

- **Root HTML & Hooks**:
  - `app.html`: Inline theme CSS variables, early theme & checkbox SVG injection, font preloading, optional-chaining browser check, Rybbit script loader, and global `<audio id="player"></audio>`.
  - `hooks.client.js`: Exports `defaultSettings` and `setUserSettings()` to merge new default keys into `localStorage.userSettings`.
  - `service-worker.js`: Optional opt-in offline caching across versioned/named caches.
- **Routes (`src/routes/...`)**:
  - `+layout.svelte`: Global modals mount, `Navbar`, `SettingsDrawer`, `BottomToolbar`, page padding, wakeLock, sign-language/mushaf mode enforcement, old bookmark migration, reading session tracking.
  - `+error.svelte`: 404 and generic error page with `noindex` meta and Rybbit error event.
  - Feature routes contain `+page.svelte`, optional `+page.js` (for param validation/redirects), route-local components (e.g., `MorphologyView.svelte`, `Table.svelte`), or raw markdown files (`ABOUT.md`, `CHANGELOG.md`, `PRIVACY.md`).
- **Views (`$views/`)**: Shared top-level page views reused by multiple routes (e.g., `$views/Chapter.svelte`, `$views/Supplications.svelte`).
- **UI Chrome (`$ui/`)**:
  - `$ui/Navbar.svelte`
  - `$ui/BottomToolbar/` (`BottomToolbar.svelte`, `BottomToolbarButtons.svelte`, button components)
  - `$ui/Modals/` (`AudioModal.svelte`, `ConfirmationAlertModal.svelte`, `CopyShareVerseModal.svelte`, `FavoriteChaptersModal.svelte`, `MorphologyModal.svelte`, `NotesModal.svelte`, `QuranNavigationModal.svelte`, `ReadingHistoryModal.svelte`, `SettingsSelectorModal.svelte`, `SiteNavigationModal.svelte`, `TafsirModal.svelte`, `TajweedRulesModal.svelte`, `VerseTranslationModal.svelte`)
  - `$ui/SettingsDrawer/` (`SettingsDrawer.svelte` and `*Selector.svelte` sub-panels)
  - `$ui/FlowbiteSvelte/` (vendored base components)
- **Display Components (`$display/`)**:
  - Cards & containers: `QuranDivisionCard.svelte`, `BookmarkCard.svelte`, `NoteCard.svelte`, `UserBookmarks.svelte`, `UserNotes.svelte`, `ScrollableFadeContainer.svelte`, `SectionDivider.svelte`.
  - `$display/layouts/`: Verse layout modes (`WordByWord.svelte`, `Normal.svelte`, `Continuous.svelte`, `SideBySide.svelte`, `TranslationTransliteration.svelte`).
  - `$display/verses/`: `WordsBlock.svelte`, `VerseTranslations.svelte`, `VerseOptionButtons.svelte`, `VerseOptionsDropdown.svelte`, `VerseSeparator.svelte`, `ArabicVerseWords.svelte`.
  - `$display/verses/modes/`: `Chapter.svelte`, `FullVersesDisplay.svelte`.
- **Misc (`$misc/`)**: `PageHead.svelte`, `Bismillah.svelte`, `ChapterHeader.svelte`, `ErrorLoadingData.svelte`.
- **Icons (`$svgs/`)**: Single-purpose SVG icon components (e.g., `Bookmark.svelte`, `Trash.svelte`, `Spinner.svelte`, `Mecca.svelte`, `Madinah.svelte`).
- **Utilities (`$utils/`)**: Stores (`stores.js`), settings (`updateSettings.js`, `resetSettings.js`, `settingsManager.js`), data fetching (`fetchData.js`, `dexie.js`), audio (`audioController.js`), navigation/URL helpers (`parseURL.js`, `validateKey.js`, `getSegmentKeys.js`), UI helpers (`getModalTransition.js`, `getWebsiteWidth.js`, `confirmationAlertHandler.js`, `terminologies.js`), and co-located `*.test.js` files.
- **Static Data & Config (`$data/`)**: `quranMeta.js`, `options.js`, `commonClasses.js`, `websiteSettings.js`, `selectableTafsirs.js`, `bismillahFontMap.js`, `faq.js`.

---

## 3. Design System

### 3.1 Color Palette

Never use standard Tailwind palette colors (e.g., `bg-gray-100`, `text-amber-600`, `dark:bg-slate-900`). Always use the semantic theme tokens powered by CSS RGB variables on `<html>`:

| Role                          | Tailwind Class / Token                                                                                                         | Usage                                                                                                                                                                                                                                                                      |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Background (Canvas)**       | `bg-theme-bg`                                                                                                                  | Document root (`html`), `Navbar`, `BottomToolbar`, `SettingsDrawer`, `Dropdown`/radio card surfaces, `tr` rows, toggle knobs (`after:bg-theme-bg`), active tag text (`text-theme-bg`).                                                                                     |
| **Primary Text**              | `text-theme-text`                                                                                                              | Applied to `<body>` in `app.html`; explicitly re-applied on `.bismillah` when needed (`text-theme-text`).                                                                                                                                                                  |
| **Accent / Interactive**      | `text-theme-accent`, `bg-theme-accent`, `border-theme-accent`, `fill-theme-accent`, `stroke-theme-accent`, `ring-theme-accent` | Active progress bar (`bg-theme-accent`), toggle active track (`peer-checked:bg-theme-accent`), icons/headings (`text-theme-accent`), hover/active borders (`hover:border-theme-accent`, `focus:border-theme-accent`), SVG stars (`fill-theme-accent stroke-theme-accent`). |
| **Surface / Subtle Fill**     | `bg-theme-accent/5`                                                                                                            | Default cards, pills, icon buttons, table `thead`, section dividers, hover states (`hover:bg-theme-accent/5`), warning/info banners.                                                                                                                                       |
| **Highlighted / Active Fill** | `bg-theme-accent/15`                                                                                                           | Currently playing/selected word highlight, toggle track off-state, toolbar primary play button.                                                                                                                                                                            |
| **Dividers & Subtle Borders** | `border-theme-accent/20`                                                                                                       | Section dividers (`border-b`, `border-t-2`), card/input/dropdown/button borders, active tab underline (`border-theme-accent/20`), placeholder text (`placeholder:text-theme-accent/50`).                                                                                   |
| **Muted Text / Icons**        | `opacity-70`, `opacity-30`, `text-theme-accent/50`                                                                             | Secondary descriptions, timestamps, captions, footnotes/bullet separators (`opacity-30`), search placeholders & `<kbd>` hints (`text-theme-accent/50`).                                                                                                                    |
| **Transparent**               | `bg-transparent`, `border-transparent`                                                                                         | Inputs (`Input`, `textarea`), resting pill/card borders before hover (`border border-transparent hover:border-theme-accent`).                                                                                                                                              |

#### Theme Definitions (`app.html`)

All 9 themes set `--theme-bg-rgb`, `--theme-accent-rgb`, `--theme-text-rgb`, and font palette CSS variables on `html.theme-{1..9}`:

| ID  | Name                   | Mode (`color`) | `--theme-bg-rgb` | `--theme-accent-rgb` | `--theme-text-rgb` |
| :-- | :--------------------- | :------------- | :--------------- | :------------------- | :----------------- |
| `1` | Golden Glint (Default) | light          | `255 255 255`    | `177 144 31`         | `0 0 0`            |
| `2` | Classic Light          | light          | `255 255 255`    | `0 0 0`              | `0 0 0`            |
| `3` | Silver Lining          | light          | `225 225 225`    | `0 0 0`              | `0 0 0`            |
| `4` | Vintage Sepia          | light          | `233 227 215`    | `85 60 15`           | `85 60 15`         |
| `5` | Mocha Night            | dark           | `32 22 31`       | `220 165 76`         | `220 165 76`       |
| `6` | Midnight Blue          | dark           | `2 2 27`         | `194 194 194`        | `194 194 194`      |
| `7` | Forest Green           | dark           | `0 22 23`        | `221 221 221`        | `221 221 221`      |
| `8` | Oled Black             | dark           | `0 0 0`          | `221 221 221`        | `221 221 221`      |
| `9` | Dark Luxury            | dark           | `9 9 11`         | `220 165 76`         | `220 165 76`       |

### 3.2 Typography

- **Font Families**:
  - UI & System: `font-sans` (tooltips, dropdowns, `<kbd>`), `system-font` (footnote superscripts).
  - Arabic Quran Text: `arabic-font-{$__fontType}` (with `arabic-font-1` for standard Uthmani previews and `arabic-font-4` for non-Uthmani Bismillah); `v4-words p{page}` with inline `style="font-family: p{page}"` for Mushaf COLRv1/OT-SVG fonts.
  - Special Quranic Fonts: `font-family: bismillah` (`.bismillah`), `font-family: chapter-headers` (`.header`), `chapter-icons`, `juz-icons`, `tajweed-rules`, `font-Arabic-Sign-Language`.
  - Dynamic Translation/Transliteration Fonts: Applied from data config (`selectableWordTranslations[id].font`, `selectableWordTransliterations[id].font`, `selectableVerseTranslations[id].font`, `selectedTafsir.font`).
- **Font Sizes**:
  - UI Body & Controls: `text-xs` (12px — descriptions, captions, badges, mini-navbar, footnotes, instructions), `text-sm` (14px — buttons, cards, list items, verse translations, default inputs/tables), `text-base` (16px — settings group items), `text-md` (section subheadings, card titles), `text-lg` (modal/verse labels on `md:`), `text-xl` (modal titles, settings group headers, topic letters), `text-2xl` (FAQ/hero mobile heading), `text-3xl` (drawer header, hero desktop heading).
  - Dynamic User-Controlled Sizes: Stored in `displaySettings.fontSizes` (`arabicText`, `wordTranslationText`, `verseTranslationText`) and swapped via `data-fontSize` attribute on `.arabicText`, `.wordTranslationText`, `.verseTranslationText`. Default: `text-2xl` mobile / `text-4xl` desktop for Arabic; `text-sm` for translations.
  - Mushaf & Headers: `text-[5.4vw] md:text-[36px] lg:text-[36px]` (Mushaf page), `text-[28vw] md:text-[195px] lg:text-[195px]` (Chapter header).
- **Weights & Line Heights**:
  - Weights: `font-normal` (tooltips, checkboxes, dropdown items, list items), `font-medium` (modal titles, settings `<h3>`, verse key pill, FAQ questions), `font-semibold` (drawer `<h5>`, section labels, footnote headers), `font-bold` (hero title, Tajweed rule titles, topic letters).
  - Line Heights & Overflow: `leading-normal`, `leading-relaxed` (empty-state instructions), `leading-tight`, `leading-none`, `truncate`, `line-clamp-1`, `break-words`, `whitespace-nowrap`.
- **Text Direction & Language**:
  - Apply `direction-rtl` and `lang="ar"` to Arabic containers; apply `direction-ltr` to word translation blocks and portaled/nested dropdowns.

### 3.3 Spacing, Sizing, Border Radius, Shadows, and Breakpoints

- **Page Width & Padding (`+layout.svelte`, `getWebsiteWidth.js`)**:
  - Outer wrapper uses `getWebsiteWidth()` (`max-w-screen-xl` when wide layout enabled, `max-w-screen-lg` otherwise) with `mx-auto`.
  - Top padding: `pt-16` (`pt-0` on `home` or Mushaf minimal mode).
  - Bottom padding: `pb-24` on reader pages (`chapter`, `juz`, `hizb`), `pb-8` elsewhere (`pb-0` in Mushaf minimal mode).
  - Horizontal padding: `px-4` (`px-0 md:px-4` on `mushaf`, `px-0` on `home`).
- **Border Radius**:
  - `rounded-full`: Pill buttons, circular icon buttons (`p-1`/`p-2`/`p-3`), `BottomToolbar`, section dividers, badges, toggle switches, range thumbs.
  - `rounded-3xl`: Modals (`md:!rounded-3xl`), `SettingsDrawer` (`md:rounded-tl-3xl md:rounded-bl-3xl`), dropdown items, inputs, textareas, selector buttons, action buttons.
  - `rounded-xl`: Division/Bookmark/Note cards, `SiteNavigationModal` tiles, homepage hero banner, Mushaf minimal-mode exit button.
  - `rounded-lg`: Individual `.word` blocks, inline radio option buttons (`AudioModal`, `CopyShareVerseModal`).
  - `rounded-2xl`: Footnote expansion boxes.
  - `rounded-md`: Info/mismatch banners, `<kbd>` shortcut badges.
- **Shadows & Z-Index**:
  - Shadows: `shadow-md` (`BottomToolbar`, portaled dropdowns), `shadow-lg` (hovered font-size slider), `shadow-sm` (morphology verb cards).
  - Z-index hierarchy: `z-10` (card menu buttons, sticky dropdown search) -> `z-20` (`Navbar`, progress bar, `BottomToolbar`, scroll-to-top, search input) -> `z-[21]` (`ConfirmationAlertModal`) -> `z-30` (`Tooltip`, sticky `SettingsDrawer` header, audio playing badge) -> `z-[1000]` (`Portal` dropdowns).
- **Breakpoints**:
  - Tailwind `md:` (768px) is the primary mobile/desktop split; `lg:` (1024px) adjusts grid columns (`lg:grid-cols-3`, `lg:grid-cols-4`) and drawer width (`lg:w-[430px]`).

### 3.4 Reusable UI Patterns

- **Shared Class Constants (`$data/commonClasses`)**: Always import `buttonClasses`, `buttonOutlineClasses`, `linkClasses`, `disabledClasses`, `individualRadioClasses`, `individualCheckboxClasses`, `selectedRadioOrCheckboxClasses` rather than duplicating them.
- **Interactive Pill / Card Surface**: Use `border border-transparent hover:border-theme-accent bg-theme-accent/5` for subtle interactive tiles, navigation links, and verse key badges.
- **Standard Bottom-Sheet Modal**:
  - Open from bottom on mobile (`!rounded-b-none md:!rounded-3xl`), round all corners on desktop, constrain height (`max-h-[90vh] flex flex-col`), and scroll only the inner content container (`flex-1 min-h-0 overflow-y-auto w-full pr-2`):

```svelte
// ReadingHistoryModal.svelte
<Modal id="readingHistoryModal" bind:open={$__readingHistoryModalVisible} transitionParams={getModalTransition('bottom')} size="md" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">Reading History</h3>

	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<!-- scrollable body -->
	</div>
</Modal>
```

- **Dropdowns**:
  - Style `<DropdownItem>` with `const dropdownItemClasses = 'flex flex-row items-center space-x-2 font-normal rounded-3xl hover:bg-theme-accent/5';`.
  - When a dropdown is anchored inside an overflow-clipped or scrollable card container, wrap `<Dropdown>` in `<Portal target="body">` with `strategy="fixed"` and `containerClass="divide-y z-[1000] shadow-md border border-theme-accent/20"`.
- **Custom Radio & Checkbox Cards**:
  - Wrap styled `<div>`s inside FlowbiteSvelte `<Radio ... custom>` or `<Checkbox ... custom>` using `individualRadioClasses` / `individualCheckboxClasses` and conditionally appending `selectedRadioOrCheckboxClasses`.
- **Toggle Switches (`SettingsDrawer.svelte`)**:
  - Use `<label class="inline-flex items-center cursor-pointer">` with `<input type="checkbox" class="sr-only peer" ... />` and `<div class={toggleBtnClasses}></div>`.
- **Tooltips**:
  - Use `<Tooltip arrow={false} type="light" placement="top" class="z-30 hidden md:block font-normal">...</Tooltip>` (hidden on mobile).
- **Loading & Error States**:
  - Render `<Spinner />` (or `<Spinner inline={true} />` inside modals) and `<ErrorLoadingData {error} />` inside `{#await ...}` blocks.

### 3.5 Theming and Dark Mode Handling

- Do **not** use Tailwind's `dark:` variant.
- Theme CSS variables are defined inline in `app.html` (`html.theme-1` through `html.theme-9`) and applied synchronously before first paint via inline `<script>` reading `localStorage.userSettings`.
- Checkbox checkmark SVG colors are injected dynamically in `app.html` by reading `--theme-accent-rgb` via `getComputedStyle`.
- Changing `websiteTheme` in `updateSettings.js` updates `localStorage` and calls `location.reload()` so all inline theme variables, checkbox SVGs, and platform-specific COLRv1/OT-SVG Mushaf font selections (`getMushafWordFontLink.js`) re-evaluate cleanly.
- Firefox dark-theme COLRv1 bugs are handled explicitly via `isFirefoxDarkTajweed()` and `isFirefoxDarkNonTajweed()`.

### 3.6 Responsive and Accessibility Patterns

- Provide `aria-label` on icon-only buttons/links (`Home`, `Menu`, `Play`, `Note`, `Bookmark`, `Options`, `Scroll to top`, card menus) and `sr-only` text on toolbar buttons.
- Include `aria-expanded`, `aria-haspopup="true"`, and `role="article"` on interactive card menus (`BookmarkCard.svelte`, `NoteCard.svelte`), and `aria-hidden="true"` on decorative icons inside labeled buttons.
- Hide desktop-only hints/tooltips on mobile (`hidden md:block`), and gate keyboard-shortcut `<kbd>` badges to pointer devices (`hidden [@media(hover:hover)_and_(pointer:fine)]:flex`).
- Disable offline-restricted links cleanly with `aria-disabled={!userOnline}` and `tabindex={userOnline ? undefined : -1}` alongside `disabledClasses`.
- Use `print:hidden` on navigation chrome (`Navbar`, `BottomToolbar`, verse option buttons) and `print:break-inside-avoid` on words and translations.

---

## 4. Code Conventions

### 4.1 Naming

- **Variables & Functions**: `camelCase` (`startVerse`, `loadQuranData`, `isAudioLengthDelay`).
- **Stores (`$utils/stores.js`)**: Prefix every Svelte store with double underscores + `camelCase` (`__currentPage`, `__audioSettings`, `__readingHistoryModalVisible`).
- **CSS Class Constants**: Name local style strings with a `Classes` suffix (`linkClasses`, `dropdownItemClasses`, `toggleBtnClasses`, `cardInnerClasses`).
- **Files**:
  - Svelte components: `PascalCase.svelte` (e.g., `ReadingHistoryModal.svelte`, `WordsBlock.svelte`).
  - SvelteKit route files: `+page.svelte`, `+page.js`, `+layout.svelte`, `+error.svelte`.
  - Utilities & handlers: `camelCase.js` (e.g., `updateSettings.js`, `readingHistoryHandler.js`).
  - Tests: `<TargetName>.test.js` co-located beside the target file.

### 4.2 Component Structure & Ordering Inside Files

Follow the standard `.svelte` layout used across the majority of components:

1. `<script>` block:
   - `export let ...` prop declarations first.
   - `import` statements (components/SVGs, `$utils/*`, `$data/*`, Svelte/third-party).
   - Local `const` definitions (options, CSS `*Classes` strings).
   - `let` state variables.
   - Reactive `$:` statements and derived blocks.
   - Helper `function` declarations (and `onMount` / `onDestroy`).
   - `__currentPage.set('...')` as the final statement in route/view `<script>` blocks.
2. Template markup (with `<PageHead ... />` at the top of route/view markup).
3. Omit component `<style>` blocks; place CSS in Tailwind classes or global stylesheets (`app.css` / `app.html`).

### 4.3 State Management, Data Fetching, and Error Handling

- **Stores & Persistence**:
  - Initialize all stores inside `if (browser)` in `$utils/stores.js` from `localStorage.getItem('userSettings')`.
  - Mutate persisted settings exclusively through `updateSettings({ type, ... })` in `$utils/updateSettings.js`. Never scatter `localStorage.setItem('userSettings', ...)` across components.
  - Register any new setting key in `defaultSettings` inside `hooks.client.js` so `setUserSettings()` automatically backfills it for existing users without overwriting their saved preferences.
- **Data Fetching & Caching**:
  - Fetch JSON via `fetchAndCacheJson(url, type)` (`$utils/fetchData.js`), which provides IndexedDB caching (7-day max age with background refresh) and in-flight request deduplication.
  - Use `fetchChapterData`, `fetchVerseTranslationData`, and `fetchWordData` for Quran content; use `preventStoreUpdate: true` when prefetching or rendering isolated previews (`ArabicVerseWords.svelte`, `MorphologyView.svelte`, offline downloads).
  - Guard network-dependent UI triggers with `if (!(await checkOnlineAndAlert())) return;` or `isUserOnline()`.
- **Error Handling**:
  - Log caught errors with `console.warn(error)` (or `console.error(error)`) and report to analytics with `window.rybbit?.error(error)`.
  - Display user-facing load failures via `<ErrorLoadingData {error} />`.
  - Use `showAlert()` and `showConfirm()` from `$utils/confirmationAlertHandler` for confirmations and alerts.

### 4.4 Commenting Style and Formatting

- Comment code thoroughly using single-line `//` comments above logic blocks, functions, and non-obvious reactive statements.
- Use tabs for indentation (as seen across `.svelte`, `.js`, and `.html` files).
- Use single quotes in JS and double quotes in HTML/Svelte attributes.

### 4.5 Import Ordering and Aliasing

- Always use configured SvelteKit aliases instead of deep relative paths (`../..`):
  - `$src/`, `$ui/`, `$views/`, `$display/`, `$misc/`, `$svgs/`, `$utils/`, `$data/`, `$app/*`, `$service-worker`.
- Group imports in order: UI/display/SVG components first, then `$data/*` and `$utils/*`, then `$app/*` and third-party packages (`svelte`, `svelte/transition`, `svelte-inview`, `marked`).

---

## 5. Hard Rules (Must Always Follow)

- **All code must be well commented, with comments starting with two slashes `//`.**
- **All variables must be `camelCase`.**
- **Do not introduce any new Tailwind colors. Only use the existing colors and classes already used in the project.**
- **Never use Tailwind `dark:` variants or hardcoded color utilities (`bg-white`, `text-gray-700`, etc.)** — always use `theme-bg`, `theme-accent`, and `theme-text` with existing opacity modifiers (`/5`, `/15`, `/20`, `/50`).
- **Prefix every Svelte store with `__` (`__myStore`)** and initialize browser-only state inside `if (browser)` in `$utils/stores.js`.
- **Add every new persisted user setting to `defaultSettings` in `hooks.client.js`** and route all mutations through `updateSettings()` in `$utils/updateSettings.js`.
- **Use `term('...')` from `$utils/terminologies`** for all Quranic domain labels (`chapter`, `verse`, `juz`, `hizb`, `tafsir`, `tajweed`, `supplications`, `meccan`, `medinan`) rather than hardcoding "Surah"/"Chapter" or "Ayah"/"Verse".
- **Use shared class constants from `$data/commonClasses`, FlowbiteSvelte primitives from `$ui/FlowbiteSvelte/*`, and icon components from `$svgs/*`** — never inline duplicate SVG paths or unstyled native form controls.
- **Report caught exceptions to `window.rybbit?.error(error)`** and guard network-only actions with `checkOnlineAndAlert()` or `isUserOnline()`.
- **Include `<PageHead ... />` and call `__currentPage.set('...')` at the bottom of `<script>`** on every page/view component.
- **Keep `<script>` blocks free of unguarded browser globals during SSR** or rely on client-only execution matching the existing route setup; clean up event listeners and observers in `onDestroy` or `onMount` return callbacks.

---

## 6. Do / Don't Examples

### 1. Theme Colors

```svelte
// DO: Use semantic theme tokens and existing opacity modifiers
// ErrorLoadingData / BookmarkCard / SettingsDrawer pattern
<button class="rounded-full border border-transparent hover:border-theme-accent bg-theme-accent/5 text-theme-accent">
	Action
</button>
```

```svelte
<!-- DON'T: Introduce Tailwind palette colors or dark: variants -->
<button class="rounded-full border border-gray-200 bg-gray-100 text-amber-600 dark:bg-slate-800 dark:text-amber-400">
	Action
</button>
```

### 2. Variable Naming & Commenting

```js
// DO: Use camelCase variables and // comments explaining intent
// utils/getWebsiteWidth.js & utils/getModalTransition.js pattern
const maxItemsToLoad = 20;
let isLoading = false;

// Returns true if the current page is a reader view
function checkReaderState(currentPage) {
  return ["chapter", "juz", "hizb"].includes(currentPage);
}
```

```js
/* DON'T: Use snake_case variables or block comments in app code */
const max_items_to_load = 20;
let is_loading = false;

function check_reader_state(current_page) {
  return ["chapter", "juz", "hizb"].includes(current_page);
}
```

### 3. Persisting Settings & Store Updates

```js
// DO: Mutate settings via updateSettings() and prefix stores with __
// SettingsDrawer.svelte & updateSettings.js pattern
import { __wideWesbiteLayoutEnabled } from "$utils/stores";
import { updateSettings } from "$utils/updateSettings";

function toggleWideLayout(enabled) {
  // Persist setting to localStorage and sync the store
  updateSettings({ type: "wideWesbiteLayoutEnabled", value: enabled });
}
```

```js
// DON'T: Write directly to localStorage.userSettings or create unprefixed stores
import { wideLayout } from "$utils/stores";

function toggleWideLayout(enabled) {
  const raw = JSON.parse(localStorage.getItem("userSettings"));
  raw.displaySettings.wideLayout = enabled;
  localStorage.setItem("userSettings", JSON.stringify(raw));
  wideLayout.set(enabled);
}
```

### 4. Quranic Terminology

```svelte
// DO: Use term() so English/Arabic terminology preferences apply everywhere
// QuranNavigationModal.svelte / AudioModal.svelte pattern
<script>
	import { term } from '$utils/terminologies';
</script>

<span>Previous {term('verse')} in {term('chapter')}</span>
```

```svelte
<!-- DON'T: Hardcode Surah/Chapter or Ayah/Verse strings -->
<span>Previous Verse in Surah</span>
```

### 5. Modals & Bottom Sheets

```svelte
// DO: Use FlowbiteSvelte Modal with mobile bottom-sheet & inner scroll container
// ReadingHistoryModal.svelte / FavoriteChaptersModal.svelte pattern
<Modal id="exampleModal" bind:open={$__exampleModalVisible} transitionParams={getModalTransition('bottom')} size="sm" class="!rounded-b-none md:!rounded-3xl max-h-[90vh] flex flex-col" bodyClass="p-6 flex flex-col min-h-0 overflow-hidden" position="bottom" center outsideclose>
	<h3 class="mb-6 text-xl font-medium flex-shrink-0">Modal Title</h3>
	<div class="flex-1 min-h-0 overflow-y-auto w-full pr-2">
		<!-- Content -->
	</div>
</Modal>
```

```svelte
<!-- DON'T: Build custom modal overlays or omit min-h-0/overflow handling -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center">
	<div class="bg-white rounded-lg p-6 max-h-96 overflow-auto">Modal Title</div>
</div>
```

### 6. Data Fetching & Error Handling

```js
// DO: Use fetchAndCacheJson and report failures to console + rybbit
// ReadingHistoryModal.svelte / UserBookmarks.svelte pattern
async function loadQuranData() {
  try {
    fullQuranTextData = await fetchAndCacheJson(cdnStaticDataUrls.fullQuranUthmani, "other");
  } catch (error) {
    console.warn(error);
    window.rybbit?.error(error);
  }
}
```

```js
// DON'T: Call raw fetch() for static JSON or swallow errors silently
async function loadQuranData() {
  try {
    const res = await fetch("https://static.quranwbw.com/data.json");
    fullQuranTextData = await res.json();
  } catch {}
}
```

### 7. Form Controls (Radio / Checkbox)

```svelte
// DO: Use FlowbiteSvelte Radio/Checkbox with custom prop and commonClasses
// DisplayTypeSelector.svelte pattern
<Radio name="displayType" bind:group={$__displayType} value={displayOption.displayID} custom>
	<div class="{individualRadioClasses} {$__displayType === displayOption.displayID && selectedRadioOrCheckboxClasses}">
		<div class="w-full">{displayOption.displayName}</div>
	</div>
</Radio>
```

```svelte
<!-- DON'T: Use unstyled native inputs -->
<label>
	<input type="radio" bind:group={$__displayType} value={displayOption.displayID} />
	{displayOption.displayName}
</label>
```

### 8. Dropdowns Inside Cards / Overflow Containers

```svelte
// DO: Portal card dropdowns to body with fixed strategy and shared item classes
// BookmarkCard.svelte / NoteCard.svelte pattern
<Portal target="body">
	<Dropdown bind:open={dropdownOpen} triggeredBy="#card-menu-{id}" strategy="fixed" containerClass="divide-y z-[1000] shadow-md border border-theme-accent/20" class="px-2 my-2 w-max text-left font-sans direction-ltr">
		<DropdownItem class={dropdownItemClasses} on:click={handleAction}>
			<Trash size={4} aria-hidden="true" />
			<span>Delete</span>
		</DropdownItem>
	</Dropdown>
</Portal>
```

```svelte
<!-- DON'T: Render Dropdown directly inside an overflow-clipped scrollable card without Portal -->
<div class="overflow-hidden">
	<Dropdown bind:open={dropdownOpen}>
		<DropdownItem on:click={handleAction}>Delete</DropdownItem>
	</Dropdown>
</div>
```

---

## 7. New Feature Checklist

Before submitting any new code or feature, verify every item below:

- [ ] **Colors**: Zero standard Tailwind color names (`gray-*`, `blue-*`, `white`, `black`) and zero `dark:` classes; only `theme-bg`, `theme-accent`, and `theme-text` (with `/5`, `/15`, `/20`, `/50` opacities) are used.
- [ ] **Variables & Comments**: All variables and functions are `camelCase`, stores use `__` prefix, and all logic is documented with `//` comments.
- [ ] **Settings & Persistence**: Any new user setting is added to `defaultSettings` in `hooks.client.js`, exposed as a `__*` store in `$utils/stores.js` (inside `if (browser)`), and mutated only via `updateSettings()`.
- [ ] **Terminology**: All occurrences of chapter, verse, juz, hizb, tafsir, tajweed, supplications, meccan, or medinan use `term('...')` from `$utils/terminologies`.
- [ ] **UI Reuse**: Buttons, links, disabled states, radios, checkboxes, modals, dropdowns, tooltips, spinners, errors, and SVG icons use `$data/commonClasses`, `$ui/FlowbiteSvelte/*`, `$misc/ErrorLoadingData.svelte`, `$svgs/*`, and `getModalTransition()`.
- [ ] **Offline & Network Safety**: Network requests use `fetchAndCacheJson()` (or appropriate `$utils/fetchData` helper), online-only interactions check `checkOnlineAndAlert()` / `isUserOnline()`, and caught errors log + call `window.rybbit?.error(error)`.
- [ ] **Routing & Metadata**: New pages include `<PageHead ... />`, set `__currentPage.set('...')` (lowercase key), and clean up any window listeners or observers on unmount.
- [ ] **Responsive & Accessibility**: Mobile (`!rounded-b-none md:!rounded-3xl`, `md:hidden` / `hidden md:block`) and accessibility (`aria-label`, `sr-only`, `print:hidden`, `direction-rtl`/`direction-ltr`) patterns are applied.
- [ ] **Tests**: Complex state/utility logic includes a co-located `*.test.js` Vitest suite matching `audioController.test.js` / `readingHistoryHandler.test.js` / `AudioModal.test.js`.
