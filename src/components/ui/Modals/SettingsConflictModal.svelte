<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __settingsConflictOptions } from '$utils/stores';
	import { useSupabaseSettings, useLocalSettings } from '$utils/supabase.js';
</script>

<Modal title="Settings Conflict" id="settingsConflictModal" bind:open={$__settingsConflictOptions.conflict} class="rounded-3xl" bodyClass="p-6 space-y-6 flex-1 overflow-y-auto overscroll-contain" headerClass="flex justify-between items-center p-6 rounded-t-3xl" center outsideclose>
	<div class="flex flex-col items-center space-y-4 text-center text-sm text-gray-700">
		<p class="text-base font-medium">
			We detected a mismatch between your <span class="font-semibold text-green-600">local</span> and <span class="font-semibold text-blue-600">cloud</span> settings.
		</p>
		<p>Please choose which version you want to keep. This will overwrite the other.</p>

		<div class="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
			<!-- Keep local settings -->
			<button on:click={useLocalSettings} class="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-all w-full sm:w-auto"> Keep Local Settings </button>

			<!-- Use Supabase/cloud settings -->
			<button on:click={useSupabaseSettings} class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all w-full sm:w-auto"> Use Cloud Settings </button>
		</div>
	</div>
</Modal>
