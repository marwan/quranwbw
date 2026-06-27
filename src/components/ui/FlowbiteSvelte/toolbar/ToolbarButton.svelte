<script>
	import { getContext } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	const background = getContext('background');
	export let color = 'default';
	export let name = undefined;
	export let ariaLabel = undefined;
	export let size = 'md';
	export let href = undefined;
	const colors = {
		default: `hover:bg-theme-accent/5`
	};
	const sizing = {
		xs: 'm-0.5 rounded-full p-0.5',
		sm: 'm-0.5 rounded-full p-0.5',
		md: 'm-0.5 rounded-full p-1.5',
		lg: 'm-0.5 rounded-full p-2.5'
	};
	let buttonClass;
	$: buttonClass = twMerge('focus:outline-none whitespace-normal', sizing[size], colors[color], color === 'default' && (background ? `` : ``), $$props.class);
	const svgSizes = {
		xs: 'w-3 h-3',
		sm: 'w-3.5 h-3.5',
		md: 'w-5 h-5',
		lg: 'w-5 h-5'
	};
</script>

{#if href}
	<a {href} {...$$restProps} class={buttonClass} aria-label={ariaLabel ?? name}>
		{#if name}<span class="sr-only">{name}</span>{/if}
		<slot svgSize={svgSizes[size]} />
	</a>
{:else}
	<button on:click type="button" {...$$restProps} class={buttonClass} aria-label={ariaLabel ?? name}>
		{#if name}<span class="sr-only">{name}</span>{/if}
		<slot svgSize={svgSizes[size]} />
	</button>
{/if}

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let color: ToolbarButtonType = 'default';
@prop export let name: string | undefined = undefined;
@prop export let ariaLabel: string | undefined = undefined;
@prop export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
@prop export let href: string | undefined = undefined;
-->
