<script>
	import { twMerge } from 'tailwind-merge';
	import { fly } from 'svelte/transition';
	import Frame from '../utils/Frame.svelte';
	import { createEventDispatcher } from 'svelte';
	import CloseButton from '../utils/CloseButton.svelte';
	import focusTrap from '../utils/focusTrap';

	const modalPositions = {
		default: {
			dialogClasses: 'fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full z-50 w-full p-4 flex',
			innerClasses: 'flex relative',
			sizes: 'w-full max-h-full'
		},
		top: {
			dialogClasses: 'fixed top-0 start-0 end-0 h-full md:h-modal md:inset-0 md:h-full z-50 w-full md:p-4 flex',
			innerClasses: 'flex fixed top-0 md:relative',
			sizes: 'w-full max-h-full'
		},
		bottom: {
			dialogClasses: 'fixed bottom-0 md:top-0 start-0 end-0 h-full md:h-modal md:inset-0 md:h-full z-50 w-full md:p-4 flex',
			innerClasses: 'flex fixed bottom-0 md:relative',
			sizes: 'w-full max-h-[90%]'
		}
	};

	export let position = 'default';
	export let open = false;
	export let title = '';
	export let size = 'md';
	export let color = 'default';
	export let placement = 'center';
	export let autoclose = false;
	export let outsideclose = false;
	export let dismissable = true;
	export let backdropClass = 'fixed inset-0 z-40 bg-[#282828c4] bg-opacity-75';
	export let classBackdrop = undefined;
	export let dialogClass = modalPositions[position].dialogClasses;
	export let classDialog = undefined;
	export let defaultClass = 'relative flex flex-col mx-auto';
	export let headerClass = 'flex justify-between items-center p-4 md:p-5 rounded-t-lg';
	export let classHeader = undefined;
	export let bodyClass = `p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain`;
	export let classBody = undefined;
	export let footerClass = 'flex items-center p-4 md:p-5 space-x-3 rtl:space-x-reverse rounded-b-lg';
	export let classFooter = undefined;
	export let transitionParams = {};

	const dispatch = createEventDispatcher();
	$: dispatch(open ? 'open' : 'close');
	function prepareFocus(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
		let n;
		while ((n = walker.nextNode())) {
			if (n instanceof HTMLElement) {
				const el = n;
				const [x, y] = isScrollable(el);
				if (x || y) el.tabIndex = 0;
			}
		}
		node.focus();
	}
	const getPlacementClasses = (placement) => {
		switch (placement) {
			// top
			case 'top-left':
				return ['justify-start', 'items-start'];
			case 'top-center':
				return ['justify-center', 'items-start'];
			case 'top-right':
				return ['justify-end', 'items-start'];
			// center
			case 'center-left':
				return ['justify-start', 'items-center'];
			case 'center':
				return ['justify-center', 'items-center'];
			case 'center-right':
				return ['justify-end', 'items-center'];
			// bottom
			case 'bottom-left':
				return ['justify-start', 'items-end'];
			case 'bottom-center':
				return ['justify-center', 'items-end'];
			case 'bottom-right':
				return ['justify-end', 'items-end'];
			default:
				return ['justify-center', 'items-center'];
		}
	};
	const sizes = {
		xs: 'max-w-full md:max-w-md',
		sm: 'max-w-full md:max-w-lg',
		md: 'max-w-full md:max-w-2xl',
		lg: 'max-w-full md:max-w-4xl',
		xl: 'max-w-full md:max-w-7xl'
	};
	const onAutoClose = (e) => {
		const target = e.target;
		if (autoclose && target?.tagName === 'BUTTON') hide(e); // close on any button click
	};
	const onOutsideClose = (e) => {
		const target = e.target;
		if (outsideclose && target === e.currentTarget) hide(e); // close on click outside
	};
	const hide = (e) => {
		e.preventDefault();
		open = false;
	};
	const isScrollable = (e) => [e.scrollWidth > e.clientWidth && ['scroll', 'auto'].indexOf(getComputedStyle(e).overflowX) >= 0, e.scrollHeight > e.clientHeight && ['scroll', 'auto'].indexOf(getComputedStyle(e).overflowY) >= 0];
	function handleKeys(e) {
		if (e.key === 'Escape' && dismissable) return hide(e);
	}
	$: backdropCls = twMerge(backdropClass, classBackdrop);
	$: dialogCls = twMerge(dialogClass, classDialog, getPlacementClasses(placement));
	$: frameCls = twMerge(defaultClass, 'w-full divide-y', $$props.class);
	$: headerCls = twMerge(headerClass, classHeader);
	$: bodyCls = twMerge(bodyClass, classBody);
	$: footerCls = twMerge(footerClass, classFooter);
</script>

{#if open}
	<!-- backdrop -->
	<div class={backdropCls} />
	<!-- dialog -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div transition:fly={transitionParams} on:keydown={handleKeys} on:wheel|preventDefault|nonpassive use:prepareFocus use:focusTrap on:click={onAutoClose} on:mousedown={onOutsideClose} class={dialogCls} tabindex="-1" aria-modal="true" role="dialog">
		<div class="{modalPositions[position].innerClasses} {sizes[size]} {modalPositions[position].sizes}">
			<Frame rounded shadow {...$$restProps} class={frameCls} {color}>
				<!-- Modal header -->
				{#if $$slots.header || title}
					<Frame class={headerCls} {color}>
						<slot name="header">
							<h3 class="text-xl font-semibold p-0">
								{title}
							</h3>
						</slot>
						{#if dismissable}<CloseButton name="Close modal" {color} on:click={hide} />{/if}
					</Frame>
				{/if}
				<!-- Modal body -->
				<div class={bodyCls} role="document" on:keydown|stopPropagation={handleKeys} on:wheel|stopPropagation|passive>
					{#if dismissable && !$$slots.header && !title}
						<CloseButton name="Close modal" class="absolute top-3 end-2.5" {color} on:click={hide} />
					{/if}
					<slot />
				</div>
				<!-- Modal footer -->
				{#if $$slots.footer}
					<Frame class={footerCls} {color}>
						<slot name="footer" />
					</Frame>
				{/if}
			</Frame>
		</div>
	</div>
{/if}
