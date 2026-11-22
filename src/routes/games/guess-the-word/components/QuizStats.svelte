<script>
	import Check from '$svgs/Check.svelte';
	import Cross from '$svgs/Cross.svelte';

	export let sessionCorrect;
	export let sessionWrong;
	export let allTimeCorrect;
	export let allTimeWrong;

	// Both scores are drawn from this one list, so they always look exactly the same.
	$: scores = [
		{ label: 'This Session', correct: sessionCorrect, wrong: sessionWrong },
		{ label: 'All Time', correct: allTimeCorrect, wrong: allTimeWrong }
	];
</script>

<div id="quiz-stats" class="flex flex-col items-center mt-4 md:mt-6 w-full px-1 md:px-4">
	<div class="flex flex-row flex-nowrap items-stretch w-full max-w-lg p-2 md:p-3 rounded-lg border-2 border-theme-accent/20 bg-theme-bg">
		{#each scores as { label, correct, wrong }, index}
			<!-- divider between the two scores -->
			{#if index > 0}
				<div class="mx-3 md:mx-6 border-l border-theme-accent/20"></div>
			{/if}

			<div class="flex flex-1 flex-col items-center text-center space-y-1">
				<span class="text-xs md:text-sm font-semibold">{label}</span>
				<div class="flex flex-row items-center space-x-2 md:space-x-3 text-sm md:text-base tabular-nums">
					<span class="inline-flex items-center gap-1"><Check size={5} /><span class="sr-only">Correct:</span>{correct}</span>
					<span class="opacity-30" aria-hidden="true">|</span>
					<span class="inline-flex items-center gap-1"><Cross size={5} /><span class="sr-only">Wrong:</span>{wrong}</span>
				</div>
			</div>
		{/each}
	</div>
</div>
