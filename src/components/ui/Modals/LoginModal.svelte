<script>
	import Modal from '$ui/FlowbiteSvelte/modal/Modal.svelte';
	import { __userSettings, __tokenModalVisible } from '$utils/stores';
	import { supabase } from '$lib/supabaseClient.js';
	import { page } from '$app/stores';
	import { downloadSettingsFromCloud } from '$utils/cloudSettings.js';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let session;

	onMount(async () => {
		session = get(page).data.session;

		if (session && !localStorage.getItem('userSettingsSynced')) {
			const settings = await downloadSettingsFromCloud();

			if (settings) {
				localStorage.setItem('userSettings', JSON.stringify(settings));
				__userSettings.set(JSON.stringify(settings));

				localStorage.setItem('userSettingsSynced', '1');
				location.reload();
			}
		}
	});

	async function loginWithGoogle() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google'
		});
		if (error) {
			console.error('Login error:', error.message);
		}
	}

	async function logout() {
		await supabase.auth.signOut();
		localStorage.removeItem('userSettingsSynced');
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
