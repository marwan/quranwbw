<script>
	import Popper from '../utils/Popper.svelte';
	import { twMerge } from 'tailwind-merge';
	export let type = 'light';
	export let defaultClass = 'py-2 px-3 text-sm font-medium';
	const types = {
		light: `${window.theme('bgMain')}`,
		custom: ''
	};
	let toolTipClass;
	$: {
		if ($$restProps.color) type = 'custom';
		else $$restProps.color = 'none';
		if (['light', 'auto'].includes(type)) $$restProps.border = true;
		toolTipClass = twMerge('tooltip', defaultClass, types[type], `border ${window.theme('border')}`, $$props.class);
	}
</script>

<Popper rounded {...$$restProps} class={toolTipClass} on:show>
	<slot />
</Popper>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let type: 'dark' | 'light' | 'auto' | 'custom' = 'dark';
@prop export let defaultClass: string = 'py-2 px-3 text-sm font-medium';
-->
