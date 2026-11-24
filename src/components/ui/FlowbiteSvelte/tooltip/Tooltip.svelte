<script>
	import Popper from '../utils/Popper.svelte';
	import { twMerge } from 'tailwind-merge';
	export let type = 'light';
	export let defaultClass = 'py-2 px-3 text-sm font-medium';
	const types = {
		light: `border-theme-accent/20 bg-theme-accent text-theme-bg`,
		custom: ''
	};
	let toolTipClass;
	let popperProps;
	$: {
		// a custom color switches to the custom type
		if ($$restProps.color) type = 'custom';
		toolTipClass = twMerge('tooltip', defaultClass, types[type], $$props.class);

		// build props for Popper (assigning into $$restProps no longer works in Svelte 5)
		popperProps = {
			...$$restProps,
			color: $$restProps.color || 'none',
			...(['light', 'auto'].includes(type) && { border: true })
		};
	}
</script>

<Popper rounded {...popperProps} class={toolTipClass} on:show>
	<slot />
</Popper>
