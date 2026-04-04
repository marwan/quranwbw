<script>
	import Wrapper from '../utils/Wrapper.svelte';
	import { twMerge } from 'tailwind-merge';
	import { getContext } from 'svelte';
	export let defaultClass = `font-medium py-2 px-4 text-sm hover:bg-theme-accent/5`;
	export let href = undefined;
	export let activeClass = undefined;
	// export let active: boolean = false;
	const context = getContext('DropdownType') ?? {};
	const activeUrlStore = getContext('activeUrl');
	let sidebarUrl = '';
	activeUrlStore.subscribe((value) => {
		// console.log('value: ', value)
		sidebarUrl = value;
	});
	$: active = sidebarUrl ? href === sidebarUrl : false;
	// let liClass: string;
	$: liClass = twMerge(defaultClass, href ? 'block' : 'w-full text-left', active && (activeClass ?? context.activeClass), $$props.class);
	// twMerge(active ? activeClass ?? context.activeClass : nonActiveClass ?? context.nonActiveClass, $$props.class);
	// console.log('active: ', active)
	let wrap = true;
	function init(node) {
		wrap = node.parentElement?.tagName === 'UL';
	}
</script>

<Wrapper tag="li" show={wrap} use={init}>
	<svelte:element this={href ? 'a' : 'button'} {href} type={href ? undefined : 'button'} role={href ? 'link' : 'button'} {...$$restProps} class={liClass} on:click on:change on:keydown on:keyup on:focus on:blur on:mouseenter on:mouseleave>
		<slot />
	</svelte:element>
</Wrapper>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let defaultClass: string = 'font-medium py-2 px-4 text-sm hover:bg-theme-accent/5';
@prop export let href: string | undefined = undefined;
@prop export let activeClass: string | undefined = undefined;
@prop export let active: boolean = false;
-->
