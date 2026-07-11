<script context="module">
	export function clampSize(s) {
		return s && s === 'xs' ? 'sm' : s === 'xl' ? 'lg' : s;
	}
</script>

<script>
	import Wrapper from '../utils/Wrapper.svelte';
	import { twMerge } from 'tailwind-merge';
	import { getContext } from 'svelte';
	export let type = 'text';
	export let value = undefined;
	export let size = undefined;
	export let defaultClass = 'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right';
	export let color = 'base';
	export let floatClass = 'flex absolute inset-y-0 items-center';
	const borderClasses = {
		base: `border border-theme-accent/20`
	};
	const ringClasses = {
		base: `focus:border-theme-accent focus:ring-theme-accent`
	};
	const colorClasses = {
		base: ''
	};
	// tinted if put in component having its own background
	let background = getContext('background');
	let group = getContext('group');
	const textSizes = { sm: 'sm:text-xs', md: 'text-sm', lg: 'sm:text-base' };
	const leftPadding = { sm: 'ps-9', md: 'ps-10', lg: 'ps-11' };
	const rightPadding = { sm: 'pe-9', md: 'pe-10', lg: 'pe-11' };
	const inputPadding = { sm: 'p-2', md: 'p-2.5', lg: 'p-3' };
	$: _size = size || clampSize(group?.size) || 'md';
	let inputClass;
	$: {
		const _color = color === 'base' && background ? 'tinted' : color;
		inputClass = twMerge([defaultClass, inputPadding[_size], ($$slots.left && leftPadding[_size]) || ($$slots.right && rightPadding[_size]), ringClasses[color], colorClasses[_color], borderClasses[color], textSizes[_size], group || 'rounded-lg', group && 'first:rounded-s-lg last:rounded-e-lg', group && 'border-s-0 first:border-s last:border-e', $$props.class]);
	}
</script>

<Wrapper class="relative w-full" show={$$slots.left || $$slots.right}>
	{#if $$slots.left}
		<div class="{twMerge(floatClass, $$props.classLeft)} start-0 ps-2.5 pointer-events-none">
			<slot name="left" />
		</div>
	{/if}
	<slot props={{ ...$$restProps, class: inputClass }}>
		<input {...$$restProps} bind:value on:blur on:change on:click on:contextmenu on:focus on:keydown on:keypress on:keyup on:mouseover on:mouseenter on:mouseleave on:paste on:input {...{ type }} class={inputClass} />
	</slot>
	{#if $$slots.right}
		<div class="{twMerge(floatClass, $$props.classRight)} end-0 pe-2.5"><slot name="right" /></div>
	{/if}
</Wrapper>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let type: InputType = 'text';
@prop export let value: any = undefined;
@prop export let size: FormSizeType | undefined = undefined;
@prop export let defaultClass: string = 'block w-full disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right';
@prop export let color: 'base' | 'green' | 'red' = 'base';
@prop export let floatClass: string = 'flex absolute inset-y-0 items-center';
-->
