<script>
	import PageHead from '$misc/PageHead.svelte';
	import Spinner from '$svgs/Spinner.svelte';
	import { getWebsiteWidth } from '$utils/getWebsiteWidth';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { __currentPage } from '$utils/stores';
	import { buttonClasses } from '$data/commonClasses';
	import { db } from '$utils/dexie';
	import { 
        getCoreMetaUrls, 
        getCoreQuranUrls, 
        getMorphologyUrls,
        getWordFontUrls,
        getWordTranslationUrls,
        getWordTransliterationUrls,
        getVerseTranslationUrls,
        getLexiconSummaryUrls,
        getTafsirUrls,
        getReciterImageUrls,
        getOfflineAssetUrls,
        getMushafFontUrls, 
        getLexiconIndexUrl,
        MUSHAF_FONT_VARIANTS,
        TOTAL_CHAPTERS
    } from '$utils/offlineResources';
	import { staticEndpoint } from '$data/websiteSettings';
    import { selectableFontTypes, selectableWordTranslations, selectableVerseTranslations, selectableReciters, verseTranslationsLanguages } from '$data/options';
    import { selectableTafsirs } from '$data/selectableTafsirs';
    import Section from './_components/Section.svelte';
    import Item from './_components/Item.svelte';

	let loading = true;
	let errorMessage = '';
    let activeDownloads = {}; // Map of label -> { total, completed }

    // Status state
	let status = {
		serviceWorker: { supported: false, controller: false },
        core: { cached: 0, total: 0 },
        mushafFonts: {}, // variantKey -> { cached, total }
        wordFonts: {}, // fontId -> { cached, total }
        translations: {}, // id -> { cached, total }
        tafsirs: {}, // slug -> { cached, total }
        lexicon: { cached: 0, total: 0 },
        images: { cached: 0, total: 0 },
        assets: { cached: 0, total: 0 }
	};

	const formatCount = (value) => value.toLocaleString();
	const formatBool = (value) => (value ? 'Yes' : 'No');

	onMount(() => {
        __currentPage.set('offline');
		loadStatus();
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleSwMessage);
        }
	});

    onDestroy(() => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.removeEventListener('message', handleSwMessage);
        }
    });

    function handleSwMessage(event) {
        const data = event.data;
        if (data.type === 'CACHE_RESOURCE_START') {
            activeDownloads[data.label] = { total: data.total, completed: 0 };
            activeDownloads = { ...activeDownloads };
        } else if (data.type === 'WARMUP_PROGRESS_MESSAGE' || data.type === 'OFFLINE_WARMUP_PROGRESS') {
             if (activeDownloads[data.stage] || activeDownloads[data.label]) {
                 const key = data.label || data.stage;
                 activeDownloads[key] = { ...activeDownloads[key], completed: data.completed };
                 activeDownloads = { ...activeDownloads };
             }
        } else if (data.type === 'CACHE_RESOURCE_DONE') {
             delete activeDownloads[data.label];
             activeDownloads = { ...activeDownloads };
             // Reload status to reflect changes
             loadStatus(); 
        }
    }

	async function loadStatus() {
		try {
            loading = true;
			const swSupported = 'serviceWorker' in navigator;
			status.serviceWorker.supported = swSupported;
			status.serviceWorker.controller = Boolean(navigator.serviceWorker?.controller);

			const cacheNames = 'caches' in window ? await caches.keys() : [];
			const dataCacheName = cacheNames.find((name) => name.startsWith('data-cache-'));
			const assetCacheName = cacheNames.find((name) => name.startsWith('asset-cache-'));
            const appCacheName = cacheNames.find((name) => name.startsWith('app-cache-'));

			const dataCache = await getCacheInfo(dataCacheName);
			const assetCache = await getCacheInfo(assetCacheName);
            const appCache = await getCacheInfo(appCacheName);
            
            // Helper to check coverage
            const check = (urls, cache) => countMatches(new Set(urls), cache.urls);

            // Core
            const coreUrls = [...getCoreMetaUrls(), ...getCoreQuranUrls(), ...getMorphologyUrls()];
            status.core = { cached: check(coreUrls, dataCache), total: coreUrls.length };

            // Mushaf Fonts
            MUSHAF_FONT_VARIANTS.forEach(v => {
                const urls = getMushafFontUrls([v]);
                status.mushafFonts[v.key] = { cached: check(urls, assetCache), total: urls.length };
            });

            // Word Fonts
            Object.values(selectableFontTypes).forEach(f => {
                const urls = getWordFontUrls(f.id);
                // These are usually in data cache, but let's check both just in case logic changes
                status.wordFonts[f.id] = { cached: check(urls, dataCache), total: urls.length };
            });

            // Translations
            Object.values(selectableVerseTranslations).forEach(t => {
                const urls = getVerseTranslationUrls(t.id);
                status.translations[t.id] = { cached: check(urls, dataCache), total: urls.length };
            });

            // Tafsirs
            Object.values(selectableTafsirs).forEach(t => {
                const urls = getTafsirUrls(t.slug);
                status.tafsirs[t.slug] = { cached: check(urls, dataCache), total: urls.length };
            });

            // Lexicon
            const lexiconUrls = [...getLexiconSummaryUrls(), getLexiconIndexUrl()];
            status.lexicon = { cached: check(lexiconUrls, dataCache), total: lexiconUrls.length };

            // Assets (Images & Misc)
            const assetUrls = getOfflineAssetUrls();
            status.assets = { cached: check(assetUrls, assetCache), total: assetUrls.length };

		} catch (error) {
			errorMessage = error?.message || 'Failed to load offline status.';
            console.error(error);
		} finally {
			loading = false;
		}
	}

	async function getCacheInfo(cacheName) {
		if (!cacheName) return { count: 0, urls: new Set() };
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		return { count: keys.length, urls: new Set(keys.map((request) => request.url)) };
	}

	function countMatches(expected, cachedUrls) {
		if (!cachedUrls || cachedUrls.size === 0) return 0;
		let count = 0;
		expected.forEach((url) => {
			if (cachedUrls.has(url)) count += 1;
		});
		return count;
	}

    function getLanguageName(id) {
        return verseTranslationsLanguages.find(l => l.language_id === id)?.language || 'Unknown Language';
    }

    async function clearAllCaches() {
        if (!confirm('Are you sure you want to delete all offline data? This action cannot be undone.')) return;
        
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        window.location.reload();
    }

    function downloadAll(includeTafsir = true) {
        const message = includeTafsir 
            ? "WARNING: This will download a MASSIVE amount of data (> 500MB) including all recitations and tafsirs. This may crash your browser or take a very long time. Are you sure?"
            : "Warning: This will download all text resources (Translations, Fonts, etc.). Are you sure?";
        
        if (!confirm(message)) return;

        // Core
        downloadResource('core', null, 'core');
        downloadResource('assets', null, 'assets');
        downloadResource('lexicon', null, 'lexicon');

        // Mushaf
        MUSHAF_FONT_VARIANTS.forEach(v => downloadResource('mushaf', v.key, v.key));

        // Word Fonts
        Object.values(selectableFontTypes).forEach(f => downloadResource('wordfont', f.id, f.id));

        // Translations
        Object.values(selectableVerseTranslations).forEach(t => downloadResource('translation', t.resource_id, t.resource_id));

        // Tafsirs
        if (includeTafsir) {
            Object.values(selectableTafsirs).forEach(t => downloadResource('tafsir', t.slug, t.slug));
        }
    }

    function downloadEssentials() {
        if (!confirm("Download Essentials? This includes Core Data, All Mushaf & Word Fonts (Arabic Text for all 114 Surahs), Lexicon, and the English Word-by-Word Translation.")) return;

        // Core
        downloadResource('core', null, 'core');
        downloadResource('lexicon', null, 'lexicon');
        downloadResource('assets', null, 'assets'); // Usually includes bismallah fonts etc

        // All Mushaf Fonts
        MUSHAF_FONT_VARIANTS.forEach(v => downloadResource('mushaf', v.key, v.key));

        // All Word Fonts (Arabic Text for all font variants)
        Object.values(selectableFontTypes).forEach(f => downloadResource('wordfont', f.id, f.id));

        // English WBW Translation (ID 1)
        // Note: 'wordtranslation' is NOT 'translation' (verse translation).
        // Since we don't list WBW translations in the UI individually, we trigger it manually or add it to "Core" conceptually?
        // But the user asked for it. We don't have a UI item for it in the list (we listing Verse Translations).
        // We will just trigger it blindly or I should add a section for WBW translations?
        // The user request was "Download Essentials... and the default english wbw translation".
        // I will trigger it.
        downloadResource('wordtranslation', 1, 'English WBW Translation');
        
        // All Word Transliterations (for offline transliteration support)
        Object.values(selectableWordTransliterations).forEach(t => downloadResource('wordtransliteration', t.id, t.language));
    }

    function downloadResource(type, id, label) {
        if (!browser) return;
        if (!navigator.serviceWorker?.controller) {
            alert("Service Worker is not active. Please refresh the page.");
            return;
        }
        
        caches.keys().then(keys => {
             // Fallbacks if caches don't exist yet
             const dataCache = keys.find(k => k.startsWith('data-cache-')) || 'data-cache-v4';
             const assetCache = keys.find(k => k.startsWith('asset-cache-')) || 'asset-cache-v4';
             
             let urls = [];
             let cacheName = dataCache;

             try {
                 if (type === 'core') {
                     urls = [
                        ...(getCoreMetaUrls() || []), 
                        ...(getCoreQuranUrls() || []), 
                        ...(getMorphologyUrls() || [])
                     ];
                     cacheName = dataCache;
                 } else if (type === 'mushaf') {
                     urls = getMushafFontUrls(MUSHAF_FONT_VARIANTS.filter(v => v.key === id));
                     cacheName = assetCache;
                 } else if (type === 'wordfont') {
                     urls = getWordFontUrls(id);
                     cacheName = dataCache;
                 } else if (type === 'wordtranslation') {
                     urls = getWordTranslationUrls(id);
                     cacheName = dataCache;
                 } else if (type === 'wordtransliteration') {
                     urls = getWordTransliterationUrls(id);
                     cacheName = dataCache;
                 } else if (type === 'translation') {
                     urls = getVerseTranslationUrls(id);
                     cacheName = dataCache;
                 } else if (type === 'tafsir') {
                     urls = getTafsirUrls(id);
                     cacheName = dataCache;
                 } else if (type === 'lexicon') {
                     urls = [...getLexiconSummaryUrls(), getLexiconIndexUrl()];
                     cacheName = dataCache;
                 } else if (type === 'assets') {
                     urls = getOfflineAssetUrls();
                     cacheName = assetCache;
                 }
             } catch (err) {
                 console.error('Error constructing URLs:', err);
                 return;
             }

             if (cacheName && urls.length > 0) {
                 const message = {
                     type: 'CACHE_SPECIFIC_RESOURCE',
                     urls,
                     cacheName,
                     label: label || id || type
                 };
                 navigator.serviceWorker.controller.postMessage(message);
                 
                 // Optimistically set active download with reactivity fix
                 activeDownloads = { 
                    ...activeDownloads, 
                    [label || id || type]: { total: urls.length, completed: 0 } 
                 };
             } else {
                 console.warn('Download blocked:', { type, id, cacheName, urlsLength: urls.length });
             }
        });
    }

    function getProgress(current, total) {
        if (!total) return 0;
        return Math.round((current / total) * 100);
    }
</script>

<PageHead title="Offline Manager" />

<div class="max-w-4xl mx-auto space-y-6 pb-20">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold">Offline Manager</h1>
			<p class="text-sm opacity-70">Manage what is stored on your device.</p>
		</div>
        <div class="flex flex-wrap gap-2">
            <button class="{buttonClasses} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border-none" on:click={clearAllCaches} disabled={loading}>
                Clear All
            </button>
		    <button class="{buttonClasses} w-fit" on:click={loadStatus} disabled={loading}>Refresh</button>
        </div>
	</div>

    <div class="flex flex-wrap gap-2">
        <button class="{buttonClasses} bg-green-600 text-white hover:bg-green-700 border-none" on:click={downloadEssentials} disabled={loading}>
            Download Essentials
        </button>
        <button class="{buttonClasses} bg-red-600 text-white hover:bg-red-700 border-none" on:click={() => downloadAll(true)} disabled={loading}>
            Download All
        </button>
        <button class="{buttonClasses} bg-red-600 text-white hover:bg-red-700 border-none" on:click={() => downloadAll(false)} disabled={loading}>
            Download All (No Tafsir)
        </button>
    </div>

	{#if browser && loading && Object.keys(activeDownloads).length === 0}
		<div class="flex items-center space-x-2 text-sm opacity-70">
			<Spinner inline={true} />
			<span>Scanning storage...</span>
		</div>
	{:else if errorMessage}
		<div class="text-sm text-red-600">{errorMessage}</div>
	{:else}
        <!-- Core System -->
        <Section title="Core System" description="Essential data for the application to work offline.">
            <Item 
                label="Core Data & Morphology" 
                cached={status.core.cached} 
                total={status.core.total} 
                downloading={activeDownloads['core']}
                on:download={() => downloadResource('core', null, 'core')} 
            />
             <Item 
                label="App Assets & Images" 
                cached={status.assets.cached} 
                total={status.assets.total} 
                downloading={activeDownloads['assets']}
                on:download={() => downloadResource('assets', null, 'assets')} 
            />
        </Section>

        <!-- Mushaf Fonts -->
        <Section title="Mushaf Page Fonts" description="Required for the 'Mushaf' reading mode.">
            {#each MUSHAF_FONT_VARIANTS as variant}
                 <Item 
                    label={variant.key} 
                    sublabel="{variant.folder}"
                    cached={status.mushafFonts[variant.key]?.cached || 0} 
                    total={status.mushafFonts[variant.key]?.total || 0} 
                    downloading={activeDownloads[variant.key]}
                    on:download={() => downloadResource('mushaf', variant.key, variant.key)} 
                />
            {/each}
        </Section>

        <!-- Word Fonts -->
        <Section title="Word Fonts" description="Fonts for individual words in 'WBW' mode.">
             {#each Object.values(selectableFontTypes) as font}
                 <Item 
                    label={font.font || font.type} 
                    sublabel={font.type}
                    cached={status.wordFonts[font.id]?.cached || 0} 
                    total={status.wordFonts[font.id]?.total || 0} 
                    downloading={activeDownloads[font.id]}
                    on:download={() => downloadResource('wordfont', font.id, font.id)} 
                />
            {/each}
        </Section>

         <!-- Translations -->
        <Section title="Translations" description="Verse translations.">
             {#each Object.values(selectableVerseTranslations) as trans}
                 <Item 
                    label={trans.resource_name} 
                    sublabel={getLanguageName(trans.language_id)}
                    cached={status.translations[trans.resource_id]?.cached || 0} 
                    total={status.translations[trans.resource_id]?.total || 0} 
                    downloading={activeDownloads[trans.resource_id]}
                    on:download={() => downloadResource('translation', trans.resource_id, trans.resource_id)} 
                />
            {/each}
        </Section>

          <!-- Tafsirs -->
        <Section title="Tafsirs" description="Exegesis and explanations.">
             {#each Object.values(selectableTafsirs) as tafsir}
                 <Item 
                    label={tafsir.name} 
                    sublabel={tafsir.author}
                    cached={status.tafsirs[tafsir.slug]?.cached || 0} 
                    total={status.tafsirs[tafsir.slug]?.total || 0} 
                    downloading={activeDownloads[tafsir.slug]}
                    on:download={() => downloadResource('tafsir', tafsir.slug, tafsir.slug)} 
                />
            {/each}
        </Section>

        <Section title="Tools" description="Additional study tools.">
             <Item 
                label="Quran Lexicon" 
                cached={status.lexicon.cached} 
                total={status.lexicon.total} 
                downloading={activeDownloads['lexicon']}
                on:download={() => downloadResource('lexicon', null, 'lexicon')} 
            />
        </Section>

	{/if}
</div>
