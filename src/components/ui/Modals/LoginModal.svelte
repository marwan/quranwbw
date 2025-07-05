<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __tokenModalVisible } from '$utils/stores';
	import { supabase } from '$utils/supabase.js';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';

	// Get the initial session returned from layout.js load function
	let session = get(page).data.session;

	// Subscribe to the $page store to update session if it changes (e.g., after OAuth login redirect)
	const unsubscribe = page.subscribe(($page) => {
		session = $page.data.session;
	});

	// Initiate Google OAuth login with Supabase
	async function loginWithGoogle() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});
		if (error) console.error('Login error:', error.message);
	}

	// Logout user and refresh the page
	async function logout() {
		await supabase.auth.signOut();
		location.reload();
	}
</script>

<Modal title="Login" id="loginModal" bind:open={$__tokenModalVisible} class="rounded-3xl" bodyClass="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain" headerClass="flex justify-between items-center p-6 rounded-t-3xl" center outsideclose>
	<div id="token-info" class="flex flex-col space-y-4 text-sm">
		{#if session}
			<p>Welcome, {session.user.email}</p>
			<button on:click={logout}>Logout</button>
		{:else}
			<button on:click={loginWithGoogle}>Login with Google</button>
		{/if}
	</div>
</Modal>
