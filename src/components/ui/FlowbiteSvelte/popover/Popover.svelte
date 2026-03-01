<script>
	import Popper from '../utils/Popper.svelte';
	export let title = '';
	export let defaultClass = `py-2 px-3`;

	const popoverClasses = `border ${window.theme('border')}` + $$props.class;
</script>

<Popper rounded {...$$restProps} class={popoverClasses} on:show>
	{#if $$slots.title || title}
		<div class="py-2 px-3">
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
