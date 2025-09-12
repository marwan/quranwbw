<script context="module">
	export {};
</script>

<script>
	import { twMerge } from 'tailwind-merge';
	import Popper from '../utils/Popper.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	const activeUrlStore = writable('');
	export let activeUrl = '';
	export let open = false;
	export let containerClass = `divide-y z-50 border ${window.theme('border')}`;
	export let classContainer = undefined;
	export let headerClass = 'py-1 overflow-hidden rounded-t-lg';
	export let classHeader = undefined;
	export let footerClass = 'py-1 overflow-hidden rounded-b-lg';
	export let classFooter = undefined;
export let activeClass = 'text-accent-primary hover:text-accent-primary/90';
	export let classActive = undefined;
	let activeCls = twMerge(activeClass, classActive);
	setContext('DropdownType', { activeClass: activeCls });
	$: activeUrlStore.set(activeUrl);
	setContext('activeUrl', activeUrlStore);
	$: containerCls = twMerge(containerClass, classContainer);
	$: headerCls = twMerge(headerClass, classHeader);
	$: ulCls = twMerge('py-1', $$props.class);
	$: footerCls = twMerge(footerClass, classFooter);
	$: {
		// set default values
		$$restProps.arrow = $$restProps.arrow ?? false;
		$$restProps.trigger = $$restProps.trigger ?? 'click';
		$$restProps.placement = $$restProps.placement ?? 'bottom';
		$$restProps.color = $$restProps.color ?? 'dropdown';
		$$restProps.shadow = $$restProps.shadow ?? true;
		$$restProps.rounded = $$restProps.rounded ?? true;
	}
</script>

<Popper activeContent {...$$restProps} class={containerCls} on:show bind:open>
	{#if $$slots.header}
		<div class={headerCls}>
			<slot name="header" />
		</div>
	{/if}
	<ul class={ulCls}>
		<slot />
	</ul>
	{#if $$slots.footer}
		<div class={footerCls}>
			<slot name="footer" />
		</div>
	{/if}
</Popper>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let activeUrl: string = '';
@prop export let open: boolean = false;
@prop export let containerClass: string = 'divide-y z-50';
@prop export let classContainer: string | undefined = undefined;
@prop export let headerClass: string = 'py-1 overflow-hidden rounded-t-lg';
@prop export let classHeader: string | undefined = undefined;
@prop export let footerClass: string = 'py-1 overflow-hidden rounded-b-lg';
@prop export let classFooter: string | undefined = undefined;
@prop export let activeClass: string = 'text-accent-primary hover:text-accent-primary/90';
@prop export let classActive: string | undefined = undefined;
-->
