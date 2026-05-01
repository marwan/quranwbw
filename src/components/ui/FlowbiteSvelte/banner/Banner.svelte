<script>
	import { twMerge } from 'tailwind-merge';
	import CloseButton from '../utils/CloseButton.svelte';
	import { createEventDispatcher } from 'svelte';
	export let position = 'sticky';
	export let dismissable = false;
	export let bannerType = 'default';
	export let divClass = 'z-10 flex justify-between p-4';
	export let innerClass = 'flex';
	let open = true;
	const dispatch = createEventDispatcher();
	$: dispatch(open ? 'open' : 'close');
	const divClasses = {
		default: `top-0 start-0 w-full border-b border-theme-accent/20`
	};
	const insideDivClasses = {
		default: 'items-center mx-auto'
	};
	$: divClass = twMerge(position, divClass, divClasses[bannerType], $$props.classDiv);
	$: div2Class = twMerge(innerClass, insideDivClasses[bannerType], $$props.classInner);
	function close(e) {
		e.preventDefault();
		open = false;
	}
</script>

{#if open}
	<div tabindex="-1" class={divClass} {...$$restProps}>
		<slot name="header" />
		<div class={div2Class}>
			<slot />
		</div>
		{#if dismissable}
			<div class="flex items-center">
				<CloseButton class="-mx-1.5 -my-1.5" color={$$restProps.color} on:click={close} on:click on:change on:keydown on:keyup on:focus on:blur on:mouseenter on:mouseleave />
			</div>
		{/if}
	</div>
{/if}

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let position: 'static' | 'fixed' | 'absolute' | 'relative' | 'sticky' = 'sticky';
@prop export let dismissable: boolean = true;
@prop export let bannerType: 'default' | 'bottom' | 'cta' | 'signup' | 'info' = 'default';
@prop export let divClass: string = 'z-10 flex justify-between p-4';
@prop export let innerClass: string = 'flex';
-->
