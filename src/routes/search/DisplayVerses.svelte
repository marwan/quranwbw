<script>
	export let data, startIndex, endIndex;

	import WordByWord from '$display/layouts/WordByWord.svelte';
	import Normal from '$display/layouts/Normal.svelte';
	import TranslationTransliteration from '$display/layouts/TranslationTransliteration.svelte';
	import { __displayType } from '$utils/stores';
	import { buttonOutlineClasses } from '$data/commonClasses';
	import { inview } from 'svelte-inview';

	// Load button click options
	const loadButtonOptions = {
		rootMargin: '2000px',
		unobserveOnEnter: true
	};

	let DisplayVerses; // for the "DisplayVerses" component
	let nextVersesProps = {};
	let versesLoadType; // previous/next
	let nextStartIndex;
	let nextEndIndex;
	const allowedDisplayTypes = [1, 2, 7];

	const displayComponents = {
		1: { component: WordByWord },
		2: { component: Normal },
		7: { component: TranslationTransliteration }
	};

	// Only allow display type 1, 2, & 7, and don't save the layout in settings if not allowed
	if (!allowedDisplayTypes.includes($__displayType)) {
		$__displayType = 1;
	}

	function loadNextVerses() {
		import('./DisplayVerses.svelte').then((res) => (DisplayVerses = res.default));
		const versesToLoad = 5;
		const lastRenderedId = document.querySelectorAll('.verse')[document.querySelectorAll('.verse').length - 1].id;
		const keys = Object.keys(data);
		const requiredIndex = keys.indexOf(lastRenderedId);

		versesLoadType = 'next';
		nextStartIndex = keys.indexOf(keys[requiredIndex + 1]);
		nextEndIndex = keys.indexOf(keys[requiredIndex + versesToLoad]);

		// don't let the end index be more than the data object's length
		if (nextEndIndex === -1) nextEndIndex = Object.keys(data).length;

		// Remove the existing button
		document.getElementById('loadVersesButton').remove();

		// Setting the nextVersesProps
		nextVersesProps = {
			startIndex: nextStartIndex,
			endIndex: nextEndIndex
		};
	}
</script>

{#each Array.from(Array(endIndex).keys()).slice(startIndex) as verse}
	{@const verseKey = Object.keys(data)[verse]}
	{@const verseValue = data[verseKey]}
	<svelte:component this={displayComponents[$__displayType]?.component} key={verseKey} value={verseValue} />
{/each}

{#if endIndex < Object.keys(data).length && document.getElementById('loadVersesButton') === null}
	<div id="loadVersesButton" class="flex justify-center pt-6 pb-18 invisible" use:inview={loadButtonOptions} on:inview_enter={(event) => document.querySelector('#loadVersesButton > button').click()}>
		<button on:click={loadNextVerses} class="text-sm {buttonOutlineClasses}"> Continue Reading </button>
	</div>
{/if}

{#if versesLoadType === 'next'}
	<svelte:component this={DisplayVerses} {data} {...nextVersesProps} />
{/if}
