<script>
	export let sessionCorrect;
	export let sessionWrong;
	export let allTimeCorrect;
	export let allTimeWrong;
</script>

<div id="quiz-stats" class="flex flex-col items-center mt-2 md:mt-6 w-full">
	<div
		class="flex flex-row flex-nowrap items-center justify-center gap-3 md:gap-6 p-2 md:p-3 rounded-2xl border-2 shadow-sm w-full max-w-lg {window.theme('border')} {window.theme('bgMain')}"
	>
		<div class="flex flex-col items-center text-center space-y-1">
			<span class="text-xs md:text-sm font-semibold">Current Score</span>
			<div class="flex flex-row items-center space-x-2 md:space-x-3 text-sm md:text-base">
				<span class="text-green-600 dark:text-green-400">✓ {sessionCorrect}</span>
				<span class="opacity-60">|</span>
				<span class="text-red-600 dark:text-red-400">✗ {sessionWrong}</span>
			</div>
		</div>

		<div class="self-stretch border-l {window.theme('border')} opacity-60" />

		<div class="flex flex-col items-center text-center space-y-1">
			<span class="text-xs md:text-sm font-semibold">All-Time Score</span>
			<div class="flex flex-row items-center space-x-2 md:space-x-3 text-xs md:text-sm opacity-80">
				<span>✓ {allTimeCorrect}</span>
				<span class="opacity-60">|</span>
				<span>✗ {allTimeWrong}</span>
			</div>
		</div>
	</div>
</div>
