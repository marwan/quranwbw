<script>
	import { twMerge } from 'tailwind-merge';
	import { fly, slide, blur, fade } from 'svelte/transition';
	import { clickOutside } from '../utils/clickOutside';
	export let activateClickOutside = true;
	export let hidden = true;
	export let position = 'fixed';
	export let leftOffset = 'inset-y-0 start-0';
	export let rightOffset = 'inset-y-0 end-0';
	export let topOffset = 'inset-x-0 top-0';
	export let bottomOffset = 'inset-x-0 bottom-0';
	export let width = 'w-80';
	export let backdrop = true;
	export let bgColor = 'bg-[#282828c4]';
	export let bgOpacity = 'bg-opacity-75';
	export let placement = 'left';
	export let id = 'drawer-example';
	export let divClass = `overflow-y-auto z-50 p-4 ${window.theme('bgMain')}`;
	export let transitionParams = {};
	export let transitionType = 'fly';
	function multiple(node, params) {
		switch (transitionType) {
			case 'slide':
				return slide(node, params);
			case 'blur':
				return blur(node, params);
			case 'fade':
				return fade(node, params);
			default:
				return fly(node, params);
		}
	}
	const placements = {
		left: leftOffset,
		right: rightOffset,
		top: topOffset,
		bottom: bottomOffset
	};
	const handleDrawer = () => {
		hidden = !hidden;
	};
	const handleClickOutside = () => activateClickOutside && !hidden && handleDrawer();
	let backdropDivClass = twMerge('settings-backdrop fixed top-0 start-0 z-50 w-full h-full', backdrop && bgColor, backdrop && bgOpacity);
	function clickOutsideWrapper(node, callback) {
		return activateClickOutside ? clickOutside(node, callback) : undefined;
	}
</script>

{#if !hidden}
	{#if backdrop && activateClickOutside}
		<div id="presentation" role="presentation" class={backdropDivClass} on:click={() => !hidden && handleDrawer()} />
	{:else if backdrop && !activateClickOutside}
		<div id="presentation" role="presentation" class={backdropDivClass} />
	{/if}

	<div use:clickOutsideWrapper={handleClickOutside} {id} {...$$restProps} class={twMerge(divClass, width, position, placements[placement], $$props.class)} transition:multiple={transitionParams} tabindex="-1" aria-controls={id} aria-labelledby={id}>
		<slot {hidden} />
	</div>
{/if}

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let activateClickOutside: boolean = true;
@prop export let hidden: boolean = true;
@prop export let position: 'fixed' | 'absolute' = 'fixed';
@prop export let leftOffset: string = 'inset-y-0 start-0';
@prop export let rightOffset: string = 'inset-y-0 end-0';
@prop export let topOffset: string = 'inset-x-0 top-0';
@prop export let bottomOffset: string = 'inset-x-0 bottom-0';
@prop export let width: string = 'w-80';
@prop export let backdrop: boolean = true;
@prop export let bgColor: string = '';
@prop export let bgOpacity: string = 'bg-opacity-75';
@prop export let placement: 'left' | 'right' | 'top' | 'bottom' = 'left';
@prop export let id: string = 'drawer-example';
@prop export let divClass: string = 'overflow-y-auto z-50 p-4 ${window.theme('bgMain')}';
@prop export let transitionParams: drawerTransitionParamTypes = {};
@prop export let transitionType: drawerTransitionTypes = 'fly';
-->
