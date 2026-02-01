<script>
	import { isUserOnline } from '$utils/serviceWorkerHandler';
	import { onMount } from 'svelte';

	// Whether the message should be vertically centered
	export let center;

	// Error object passed from the parent (usually from a failed fetch)
	export let error = null;

	// Default centering behavior
	$: center = center === undefined ? true : center;

	// Optional error code extracted from the error message (if JSON-encoded)
	let errorCode = null;

	// Attempt to extract HTTP status code from the error message
	$: if (error && typeof error.message === 'string') {
		try {
			const parsed = JSON.parse(error.message);
			errorCode = parsed.status;
		} catch {
			// Ignore parsing errors and fall back to a generic message
			errorCode = null;
		}
	}

	// Log the error once for debugging purposes
	if (error !== null) {
		console.warn(error);
	}

	// Tracks the user's network state
	let userOnline = true;

	// Check online status when the component mounts
	onMount(async () => {
		userOnline = await isUserOnline();
	});
</script>

<div class="flex flex-col space-y-4 justify-center text-center !text-sm max-w-xl mx-auto" class:pt-[30vh]={center === true}>
	<p>Sorry, we couldn’t load the data right now. Please try again in a {errorCode !== null ? `moment (${errorCode})` : 'moment'}.</p>

	{#if !userOnline}
		<p>It also looks like you’re currently offline. Please reconnect to the internet and, if you plan to use this page offline, make sure the required offline data is downloaded beforehand.</p>
	{/if}
</div>
