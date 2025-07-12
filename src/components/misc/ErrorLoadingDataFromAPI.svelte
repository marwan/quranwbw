<script>
	export let center,
		error = null;

	$: center = center === undefined ? true : center;

	let errorCode = null;

	$: if (error && typeof error.message === 'string') {
		try {
			const parsed = JSON.parse(error.message);
			errorCode = parsed.status;
		} catch {
			errorCode = null;
		}
	}

	if (error !== null) {
		console.warn(error);
	}
</script>

<div class="flex justify-center text-center !text-sm" class:pt-[30vh]={center === true}>
	<p>Sorry, we couldn’t load the data right now. Please try again in a {errorCode !== null ? `moment (${errorCode})` : 'moment'}.</p>
</div>
