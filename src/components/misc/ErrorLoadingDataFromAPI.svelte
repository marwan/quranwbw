<script>
	export let center;
	$: center = center === undefined ? true : center;
</script>

<div class="flex justify-center text-center !text-sm" class:pt-[30vh]={center === true}>
	<p>Sorry, we couldn’t load the data right now. Please try again in a moment.</p>
</div>
