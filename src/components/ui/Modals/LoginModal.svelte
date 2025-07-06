<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __loginModalVisible } from '$utils/stores';
	import { loginWithGoogle, logout } from '$utils/supabase.js';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Get the initial session returned from layout.js load function
	let session = get(page).data.session;

	// Subscribe to the $page store to update session if it changes (e.g., after OAuth login redirect).
	const unsubscribe = page.subscribe(($page) => {
		session = $page.data.session;
	});
</script>

<Modal title="Login" id="loginModal" bind:open={$__loginModalVisible} class="rounded-3xl" bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain" headerClass="flex justify-between items-center p-6 rounded-t-3xl" center outsideclose>
	<div class="flex flex-col items-center space-y-4 text-sm text-center">
		{#if session}
			<div class="flex flex-col items-center space-y-2">
				<img src={session.user.user_metadata.avatar_url} alt="User Avatar" class="w-12 h-12 rounded-full object-cover shadow" referrerpolicy="no-referrer" />
				<p class="text-base font-medium">Welcome, {session.user.user_metadata.name}</p>
				<button on:click={logout} class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"> Logout </button>
			</div>
		{:else}
			<button on:click={loginWithGoogle} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"> Login with Google </button>
		{/if}
	</div>
</Modal>
