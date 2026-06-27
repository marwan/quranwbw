<script>
	import Popper from '../utils/Popper.svelte';
	export let title = '';
	export let defaultClass = 'py-2 px-3';
</script>

<Popper activeContent border shadow rounded {...$$restProps} class={$$props.class} on:show>
	{#if $$slots.title || title}
		<div class="py-2 px-3 rounded-t-md border-b border-theme-accent/20">
			<slot name="title">
				<h3 class="font-semibold">{title}</h3>
			</slot>
		</div>
	{/if}
	<div class={defaultClass}>
		<slot />
	</div>
</Popper>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let title: string = '';
@prop export let defaultClass: string = 'py-2 px-3';
-->
