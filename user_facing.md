# User-Facing Files Requiring Translation# User-Facing Files Requiring Translation



This document lists all files containing user-facing text that needs translation support.This document lists all files containing user-facing text that needs translation support.



------



## Files WITH User-Facing Text (73 files)## Files WITH User-Facing Text



### Data Files (3 files)### Data Files

- src/data/faq.js

- src/data/faq.js- src/data/options.js

- src/data/options.js- src/data/websiteSettings.js

- src/data/websiteSettings.js

### Components - Display Verses

### Components - Display Verses (8 files)- src/components/display/verses/ArabicVerseWords.svelte

- src/components/display/verses/PageDivider.svelte

- src/components/display/verses/ArabicVerseWords.svelte**HAS USER-FACING TEXT** - "Page", uses term('juz')

- src/components/display/verses/PageDivider.svelte

- src/components/display/verses/VerseOptionButtons.svelte### src/components/display/verses/VerseOptionButtons.svelte - checked

- src/components/display/verses/VerseOptionsDropdown.svelte**HAS USER-FACING TEXT** - Uses term() function for verse/chapter, aria-labels: "Play", "Note", "Bookmark", "Options", "Toggle Words"

- src/components/display/verses/VerseTranslations.svelte

- src/components/display/verses/WordsBlock.svelte### src/components/display/verses/VerseOptionsDropdown.svelte - checked

- src/components/display/verses/modes/Chapter.svelte**HAS USER-FACING TEXT** - Menu items: "Advanced Play", "Bookmark"/"Unbookmark", "Notes", "Translation", "Morphology", "Copy", uses term() for tafsir/chapter/verse

- src/components/display/verses/modes/FullVersesDisplay.svelte

### src/components/display/verses/VerseTranslations.svelte - checked

### Components - Misc (2 files)**HAS USER-FACING TEXT** - "Show footnote", "Close footnote", "Footnote #", "loading...", "Footnote not available."



- src/components/misc/ErrorLoadingData.svelte### src/components/display/verses/WordsBlock.svelte - checked

- src/components/misc/PageHead.svelte**HAS USER-FACING TEXT** - Tooltip: "End of {key}"



### Components - UI Navbar & Toolbar (8 files)### src/components/display/verses/modes/Chapter.svelte - checked

**HAS USER-FACING TEXT** - Button text: "Continue Reading"

- src/components/ui/Navbar.svelte

- src/components/ui/BottomToolbar/AudioButton.svelte### src/components/display/verses/modes/FullVersesDisplay.svelte - checked

- src/components/ui/BottomToolbar/DisplayChangeButton.svelte**HAS USER-FACING TEXT** - Button text: "Continue Reading", "Start of {term('juz')}", "Previous {term('verse')}"

- src/components/ui/BottomToolbar/MushafMinimalMode.svelte

- src/components/ui/BottomToolbar/SettingsButton.svelte### src/components/misc/ErrorLoadingData.svelte - checked

- src/components/ui/BottomToolbar/ChapterModeButton.svelte**HAS USER-FACING TEXT** - "Sorry, we couldn't load the data right now. Please try again in a moment."

- src/components/ui/BottomToolbar/LeftNavigationButton.svelte

- src/components/ui/BottomToolbar/RightNavigationButton.svelte

### src/components/ui/Navbar.svelte - checked

### Components - Modals (11 files)**HAS USER-FACING TEXT** - "Home", "Menu", "Page", uses term() for juz/chapter/supplications/meccan/medinan, aria-labels



- src/components/ui/Modals/AudioModal.svelte### src/components/ui/BottomToolbar/AudioButton.svelte - checked

- src/components/ui/Modals/CopyShareVerseModal.svelte**HAS USER-FACING TEXT** - title: "Pause"/"Play"

- src/components/ui/Modals/TajweedRulesModal.svelte

- src/components/ui/Modals/NotesModal.svelte### src/components/ui/BottomToolbar/DisplayChangeButton.svelte - checked

- src/components/ui/Modals/ConfirmationAlertModal.svelte**HAS USER-FACING TEXT** - title: "Display Type"

- src/components/ui/Modals/DownloadModal.svelte

- src/components/ui/Modals/LexiconModal.svelte### src/components/ui/BottomToolbar/MushafMinimalMode.svelte - checked

- src/components/ui/Modals/MorphologyModal.svelte**HAS USER-FACING TEXT** - title: "Minimal Mode"

- src/components/ui/Modals/QuranNavigationModal.svelte

- src/components/ui/Modals/SiteNavigationModal.svelte### src/components/ui/BottomToolbar/SettingsButton.svelte - checked

- src/components/ui/Modals/TafsirModal.svelte**HAS USER-FACING TEXT** - title: "Settings"



### Components - Settings Drawer (6 files)### src/components/ui/Modals/AudioModal.svelte - checked

**HAS USER-FACING TEXT** - Extensive text:

- src/components/ui/SettingsDrawer/SettingsDrawer.svelte- Labels: "Play", "Language", "Range", "Repeat", "From", "To", "Times"

- src/components/ui/SettingsDrawer/VerseReciterSelector.svelte- Options: "Verse"/"Words", "Arabic"/"Translation"/"Both", "This {verse}"/"From Here"/"Custom", "Each {verse}"/"Verse Range"

- src/components/ui/SettingsDrawer/WebsiteThemeSelector.svelte- Buttons: "Play"/"Cancel", "Set As Default"/"Reset to Default"

- src/components/ui/SettingsDrawer/WordTransliterationSelector.svelte- Descriptions and help text

- src/components/ui/SettingsDrawer/VerseTranslationSelector.svelte

- src/components/ui/SettingsDrawer/VerseTransliterationSelector.svelte### src/components/ui/Modals/CopyShareVerseModal.svelte - checked

**HAS USER-FACING TEXT** - Extensive text:

### Routes (15 files)- Labels: "Type", "Text"

- Options: "Text"/"Link"/"Advanced", "Arabic"/"Translation"/"Both"

- src/routes/+page.svelte- Checkboxes: "Include {chapter} Name & {verse} Key", "Include Author Names", "Include Footnotes", "Include Website Link"

- src/routes/about/+page.svelte- Messages: "Text copied to clipboard", "Click here to download it as a file", "Link copied to clipboard"

- src/routes/bookmarks/+page.svelte- Button: "Copy"

- src/routes/changelog/+page.svelte

- src/routes/faq/+page.svelte### src/components/ui/Modals/TajweedRulesModal.svelte - checked

- src/routes/search/+page.svelte**HAS USER-FACING TEXT** - "Icon", "Description", "Examples:", "To learn the correct pronunciation...", uses term() for tajweed

- src/routes/games/guess-the-word/+page.svelte

- src/routes/supplications/+page.svelte### src/components/ui/Modals/NotesModal.svelte - checked

- src/routes/juz/[juz]/+page.svelte**HAS USER-FACING TEXT** - Placeholder: "Write your thoughts here...", "Modified {time}", Button: "Update"/"Save", "Are you sure you want to reset this note?"

- src/routes/morphology/+page.svelte

- src/routes/morphology/MorphologyView.svelte### src/components/ui/Modals/ConfirmationAlertModal.svelte - checked

- src/routes/morphology/Table.svelte**HAS USER-FACING TEXT** - Modal text: "Confirmation", "Alert", "Confirm", "Cancel", "Got it"

- src/routes/page/[page]/+page.svelte

- src/routes/[chapter]/+error.svelte### src/components/ui/Modals/DownloadModal.svelte - checked

- src/routes/morphology/+error.svelte**HAS USER-FACING TEXT** - Offline mode UI:

- Title: "Offline Mode"

### Views (2 files)- Description paragraphs

- Labels: "Font Type:", "Word Translation:", "Word Transliteration:", "Verse Translations/Transliterations:", "Last Download:", "Service Worker Registered:", "Never", "Just Now", "Checking...", "Yes", "No", "{n} Selected", "None"

- src/views/Chapter.svelte- Messages: "Your settings were changed since the last download.", "Starting download...", "Downloading... {n}%", "Download complete!", "Download stopped!", "Error downloading data.", "Data deleted!", "Error deleting data."

- src/views/Supplications.svelte- Buttons: "Download Again", "Download Data", "Delete Data", "Stop Download"



### Utilities (1 file)### src/components/ui/Modals/LexiconModal.svelte - checked

**HAS USER-FACING TEXT** - "No data for this word."

- src/utils/terminologies.js

### src/components/ui/Modals/MorphologyModal.svelte - checked

### App Files (1 file)**HAS USER-FACING TEXT** - "Word {key}", "Full View Morphology Button" aria-label



- src/app.html### src/components/ui/Modals/QuranNavigationModal.svelte - checked

**HAS USER-FACING TEXT** - Extensive navigation modal text:

### i18n Translation Files - Already Localized (10 files)- Title: "Navigate"

- Placeholder: "Navigate or Search Quran"

- src/lib/i18n/locales/en.json- Instructions: "Enter a {chapter}, page, {juz} number, or {verse}/word key..."

- src/lib/i18n/locales/en/common.json- Sections: "Last Read", "Suggestions", "Navigate", "Search Quran", uses term() for chapters/verses/juz

- src/lib/i18n/locales/en/mostRead.json- Labels: "{chapter}", "Page", "{juz}", "Mushaf Page", "Word {key} Morphology", "Search Quran"

- src/lib/i18n/locales/en/chapters.json- Button: "Close"

- src/lib/i18n/locales/en/tajweed.json

- src/lib/i18n/locales/fr.json### src/components/ui/Modals/SiteNavigationModal.svelte - checked

- src/lib/i18n/locales/fr/common.json**HAS USER-FACING TEXT** - Navigation links:

- src/lib/i18n/locales/fr/mostRead.json- Header: "Navigate"

- src/lib/i18n/locales/fr/chapters.json- Links: "Search", "Settings", "Bookmarks", "{tajweed} Rules", "{supplications}", "Morphology", "Word Game", "Changelog", "Old Website", "About"

- src/lib/i18n/locales/fr/tajweed.json

### src/components/ui/Modals/TafsirModal.svelte - checked

---**HAS USER-FACING TEXT** - Footer buttons: "Previous {verse}", "Next {verse}" (uses term())



## Files WITHOUT User-Facing Text (57 files)### src/app.html - checked

**HAS USER-FACING TEXT** - Meta description, browser compatibility alert message

### Data Files (4 files)

### src/routes/+page.svelte - checked

- src/data/commonClasses.js**HAS USER-FACING TEXT** - Homepage content: "Search", "Bookmarks", "Notes", "Suggestions", "Continue Reading", chapter names, navigation

- src/data/quranMeta.js

- src/data/selectableTafsirs.js### src/routes/about/+page.svelte - checked

- src/data/tajweedRulings.js**HAS USER-FACING TEXT** - About page content (uses markdown file)



### Components - Display Layouts (5 files)### src/routes/bookmarks/+page.svelte - checked

**HAS USER-FACING TEXT** - Bookmarks page UI text

- src/components/display/layouts/Continuous.svelte

- src/components/display/layouts/Normal.svelte### src/routes/changelog/+page.svelte - checked

- src/components/display/layouts/SideBySide.svelte**HAS USER-FACING TEXT** - "Changelog" title (uses markdown file)

- src/components/display/layouts/TranslationTransliteration.svelte

- src/components/display/layouts/WordByWord.svelte### src/routes/faq/+page.svelte - checked

**HAS USER-FACING TEXT** - "Frequently Asked Questions", FAQ numbering format

### Components - Display Verses (1 file)

### src/routes/search/+page.svelte - checked

- src/components/display/verses/VerseSeparator.svelte**HAS USER-FACING TEXT** - Extensive search page text:

- Placeholder: "Search Ibrahim, Mary, Jannat, كتاب..."

### Components - Misc (2 files)- Instructions: "Search for any text...", "Unfortunately, your query did not yield any results..."

- Results: "Showing {n} results related to...", "Page", "Juz"

- src/components/misc/Bismillah.svelte

- src/components/misc/ChapterHeader.svelte### src/routes/games/guess-the-word/+page.svelte - checked

**HAS USER-FACING TEXT** - Game UI text:

### Components - UI Bottom Toolbar (2 files)- "Guess the correct translation:", "Confirm", "Skip", "Next"

- "Your answer was correct 😀", "Sorry, the correct answer was...", "Correct:", "Wrong:"

- src/components/ui/BottomToolbar/BottomToolbar.svelte

- src/components/ui/BottomToolbar/BottomToolbarButtons.svelte### src/routes/supplications/+page.svelte - checked

**HAS USER-FACING TEXT** - Uses term() for "Quranic {supplications}" in title

### Components - Modals (2 files)

### src/routes/juz/[juz]/+page.svelte - checked

- src/components/ui/Modals/SettingsSelectorModal.svelte**HAS USER-FACING TEXT** - Uses term() for juz in page title

- src/components/ui/Modals/VerseTranslationModal.svelte

### src/routes/morphology/+page.svelte - checked

### Components - Settings Drawer (6 files)**HAS USER-FACING TEXT** - "Morphology" in page title



- src/components/ui/SettingsDrawer/DisplayTypeSelector.svelte### src/routes/morphology/MorphologyView.svelte - checked

- src/components/ui/SettingsDrawer/QuranFontSelector.svelte**HAS USER-FACING TEXT** - Morphology page text:

- src/components/ui/SettingsDrawer/VersePlayButtonSelector.svelte- Navigation: uses term() for chapter/verse

- src/components/ui/SettingsDrawer/VerseTafsirSelector.svelte- Buttons: "Play Word", "Goto Verse"

- src/components/ui/SettingsDrawer/WordTooltipSelector.svelte- Table headings: "words", "word", "with the same root", "appearing exactly"

- src/components/ui/SettingsDrawer/WordTranslationSelector.svelte- Button: "Load more"



### Routes (6 files)### src/routes/morphology/Table.svelte - checked

**HAS USER-FACING TEXT** - Table content:

- src/routes/+layout.js- "{n} words/word {type}", "Load more"

- src/routes/+layout.svelte- Table headers: "#", "Word", "Translation", "Transliteration", uses term() for verse

- src/routes/games/+page.js

- src/routes/juz/+page.js## View Files

- src/routes/[chapter]/+page.svelte

- src/routes/[chapter]/[verse]/+page.svelte### src/views/Chapter.svelte - checked

**HAS USER-FACING TEXT** - Chapter view text:

### Utilities (2 files)- Buttons: "Start of {chapter}", "Previous {verse}" (uses term())



- src/utils/timeAgo.js### src/views/Supplications.svelte - checked

- src/utils/audioController.js**HAS USER-FACING TEXT** - Uses term() for "Quranic {supplications}"



### i18n (1 file)### src/components/ui/BottomToolbar/ChapterModeButton.svelte - checked

**HAS USER-FACING TEXT** - Uses term() for "{chapter} Mode"

- src/lib/i18n/index.js

### src/components/ui/BottomToolbar/LeftNavigationButton.svelte - checked

### SVG Icon Components (26+ files)**HAS USER-FACING TEXT** - "Previous {chapter}", "Next Page" (uses term())



All SVG icon components are presentational only and contain no translatable text.### src/components/ui/BottomToolbar/RightNavigationButton.svelte - checked

**HAS USER-FACING TEXT** - "Next {chapter}", "Previous Page" (uses term())

---

### src/components/ui/SettingsDrawer/SettingsDrawer.svelte - checked

## Summary**HAS USER-FACING TEXT** - Extensive settings UI text:

- Header: "Settings"

**Total Source Files Reviewed:** 130 files  - Sections: "Display", "Font", "Translation, Transliteration & {tafsir}", "Audio", "Miscellaneous"

**Files WITH User-Facing Text:** 73 files (56%)  - Settings labels: "Theme", "Display Type", "Word Tooltip", "Word Translation", "Word Transliteration", "Prevent Sleep", "Wide Website Layout", "Arabic Sign Language", "Quran Font", "Arabic Word Size", "Word Translation/Transliteration Size", "Sign Language Icon Size", "{verse} Translation/Transliteration Size", "{verse} Translation", "{verse} Transliteration", "{tafsir}", "{verse} Reciter", "Playback Speed", "{verse} Play Button", "English Terminologies", "Hide Non-{supplications} Words", "Word Morphology On Click", "Backup & Restore", "Reset Settings"

**Files WITHOUT User-Facing Text:** 57 files (44%)- Descriptions for each setting

- Buttons: "Set As Default", "Reset to Default", "Backup", "Restore", "Reset", "Close", "← Back"

### Key Translation Areas- Messages: "An assortment of website themes...", confirmation prompts, etc.

- Build version text

1. **UI Labels & Buttons** - Modals, settings, navigation components

2. **Error Messages** - Error pages, data loading components### src/components/ui/SettingsDrawer/VerseReciterSelector.svelte - checked

3. **Instructions & Descriptions** - Settings drawer, modals, search page**HAS USER-FACING TEXT** - Section headers: "Translation", "Arabic"

4. **Form Labels** - Audio modal, copy/share modal, settings

5. **Terminology System** - terminologies.js (English/Arabic switching)### src/components/ui/SettingsDrawer/WebsiteThemeSelector.svelte - checked

6. **i18n Files** - Already localized for EN/FR (chapters, tajweed, common terms, mostRead)**HAS USER-FACING TEXT** - "Got a unique color combo in mind that's a visual delight? Shoot your suggestions over to quranwbw@gmail.com."



### Recommended Translation Approach### src/components/ui/SettingsDrawer/WordTransliterationSelector.svelte - checked

**HAS USER-FACING TEXT** - Warning: "Relying solely on transliteration to recite the Quran is not recommended..."

1. **Extend existing svelte-i18n infrastructure** - Already set up with EN/FR support

2. **Add translation keys** - For all hardcoded strings in the 73 files identified### src/components/ui/SettingsDrawer/VerseTranslationSelector.svelte - checked

3. **Leverage term() function** - Existing pattern for terminology switching**HAS USER-FACING TEXT** - Instruction: "The translations appear in the order you select them. To rearrange the sequence, simply deselect all options and then reselect them in your desired order."

4. **Use $t() function consistently** - Apply across all user-facing text

5. **Follow existing patterns** - Seen in tajweed.json, chapters.json, common.json, mostRead.json### src/components/ui/SettingsDrawer/VerseTransliterationSelector.svelte - checked

**HAS USER-FACING TEXT** - Warning: "Relying solely on transliteration to recite the Quran is not recommended..."

### src/utils/terminologies.js - checked
**HAS USER-FACING TEXT** - Terminology mappings:
- English: Chapter, Chapters, Verse, Verses, Supplications, Exegesis, Pronunciation, Part, Parts, Meccan, Medinan
- Arabic: Surah, Surah, Ayah, Ayat, Duas, Tafsir, Tajweed, Juz, Juz, Makki, Madani

## Additional Route Files

### src/routes/page/[page]/+page.svelte - checked
**HAS USER-FACING TEXT** - Mushaf page:
- Page title: "Page {n}"
- Button tooltip: "Minimal Mode"

### src/routes/[chapter]/+error.svelte - checked
**HAS USER-FACING TEXT** - Error page messages:
- "The content you were looking for was not found."
- "There was an error while loading the content. Please try again later."
- "If you think this error shouldn't occur, please let us know via email."
- "Go back to homepage."

### src/routes/morphology/+error.svelte - checked
**HAS USER-FACING TEXT** - Same error messages as above
