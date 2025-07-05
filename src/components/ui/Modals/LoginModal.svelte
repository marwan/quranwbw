<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __userToken, __userSettings, __tokenModalVisible } from '$utils/stores';
	import { supabase } from '$lib/supabaseClient.js';
	import { page } from '$app/stores';

	// Access the session reactively
	$: session = $page.data.session;

	async function loginWithGoogle() {
		await supabase.auth.signInWithOAuth({
			provider: 'google'
		});
	}

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
