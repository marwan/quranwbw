<script>
	export let sessionCorrect;
	export let sessionWrong;
	export let allTimeCorrect;
	export let allTimeWrong;
</script>

<div id="quiz-stats" class="flex flex-col space-y-2 md:space-y-3 items-center mt-2 md:mt-6">
	<!-- Session Score -->
	<div class="flex flex-col items-center space-y-1 p-2 md:p-4 rounded-lg border-2 {window.theme('borderSecondary')}">
		<span class="text-xs md:text-sm font-semibold">Current Score</span>
		<div class="flex flex-row space-x-2 md:space-x-4 text-sm md:text-md">
			<span class="text-green-600 dark:text-green-400">✓ {sessionCorrect}</span>
			<span>|</span>
			<span class="text-red-600 dark:text-red-400">✗ {sessionWrong}</span>
		</div>
	</div>
	<!-- All-Time Score -->
	<div class="flex flex-row space-x-4 text-xs opacity-70">
		<span>All-Time: Correct {allTimeCorrect} | Wrong {allTimeWrong}</span>
	</div>
</div>
