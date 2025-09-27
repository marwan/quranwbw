<script>
	import { createEventDispatcher, setContext } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import {} from 'svelte/transition';
	const noop = () => {};
	setContext('background', true);
	export let tag = $$restProps.href ? 'a' : 'div';
	export let color = 'default';
	export let rounded = false;
	export let shadow = false;
	// For components development
	export let node = undefined;
	// Action function and its params
	export let use = noop;
	export let options = {};
	export let role = undefined;
	// Export a prop through which you can set a desired svelte transition
	export let transition = undefined;
	// Pass in extra transition params
	export let params = {};
	export let open = true;
	const dispatch = createEventDispatcher();
	$: dispatch(open ? 'open' : 'close');
	$: dispatch('show', open);
	$: color = color ?? 'default'; // for cases when undefined
	$: setContext('color', color);
	// your script goes here
	const bgColors = {
		default: `${window.theme('bgMain')}`,
		dropdown: `${window.theme('bgMain')}`,
		navbar: `${window.theme('bgMain')}`,
		navbarUl: '',
		form: '',
		none: ''
	};
	const textColors = {
		default: '',
		dropdown: '',
		navbar: '',
		navbarUl: '',
		form: '',
		none: ''
	};
	const borderColors = {
		default: ``,
		dropdown: `${window.theme('border')}`,
		navbar: `${window.theme('border')}`,
		navbarUl: `${window.theme('border')}`,
		form: `${window.theme('border')}`,
		none: ''
	};
	let divClass;
	$: divClass = twMerge(bgColors[color], textColors[color], rounded && 'rounded-3xl', ``, borderColors[color], shadow && 'shadow-md', $$props.class);
</script>

{#if transition && open}
	<svelte:element this={tag} transition:transition={params} use:use={options} bind:this={node} {role} {...$$restProps} class={divClass} on:click on:mouseenter on:mouseleave on:focusin on:focusout>
		<slot />
	</svelte:element>
{:else if open}
	<svelte:element this={tag} use:use={options} bind:this={node} {role} {...$$restProps} class={divClass} on:click on:mouseenter on:mouseleave on:focusin on:focusout>
		<slot />
	</svelte:element>
{/if}

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let tag: string = $$restProps.href ? 'a' : 'div';
@prop export let color: FrameColor = 'default';
@prop export let rounded: boolean = false;
@prop export let border: boolean = false;
@prop export let shadow: boolean = false;
@prop export let node: HTMLElement | undefined = undefined;
@prop export let use: Action<HTMLElement, any> = noop;
@prop export let options = {};
@prop export let role: string | undefined = undefined;
@prop export let transition: TransitionFunc | undefined = undefined;
@prop export let params: object = {};
@prop export let open: boolean = true;
-->
