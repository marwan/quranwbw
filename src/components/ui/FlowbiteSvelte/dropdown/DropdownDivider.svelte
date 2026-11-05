<script>
	import { twMerge } from 'tailwind-merge';
	export let divClass = 'my-1 h-px';
</script>

<div {...$$restProps} class={twMerge(divClass, $$props.class)}></div>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let divClass: string = 'my-1 h-px';
-->
