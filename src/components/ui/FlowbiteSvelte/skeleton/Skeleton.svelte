<script>
	import { twMerge } from 'tailwind-merge';
	const sizes = {
		xxl: 'max-w-2xl'
	};
	export let divClass = 'animate-pulse';
	export let size = 'sm';
	$: outDivclass = twMerge(sizes[size], divClass, $$props.class);
</script>

<div role="status" class={outDivclass}>
	<div class="h-2 bg-theme-accent/15 rounded-full mb-2.5" />
	<div class="h-2 bg-theme-accent/15 rounded-full w-10/12 mb-2.5" />
	<div class="h-2 bg-theme-accent/15 rounded-full w-11/12 mb-2.5" />
	<div class="h-2 bg-theme-accent/15 rounded-full w-9/12" />
	<span class="sr-only">Loading...</span>
</div>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let divClass: string = 'animate-pulse';
@prop export let size: keyof Sizes = 'sm';
-->
