<script>
	import * as dom from '@floating-ui/dom';
	import { onMount, createEventDispatcher } from 'svelte';
	import Frame from './Frame.svelte';
	export let activeContent = false;
	export let offset = 8;
	export let placement = 'top';
	export let trigger = 'hover';
	export let triggeredBy = undefined;
	export let reference = undefined;
	export let strategy = 'absolute';
	export let open = false;
	export let yOnly = false;
	// extra floating UI middleware list
	export let middlewares = [dom.flip(), dom.shift()];
	const dispatch = createEventDispatcher();
	let clickable;
	$: clickable = trigger === 'click';
	let hoverable;
	$: hoverable = trigger === 'hover';
	$: dispatch('show', open);
	$: placement && (referenceEl = referenceEl);
	let referenceEl;
	let floatingEl;
	let contentEl;
	let triggerEls = [];
	let _blocked = false; // management of the race condition between focusin and click events
	const block = () => ((_blocked = true), setTimeout(() => (_blocked = false), 250));
	const showHandler = (ev) => {
		if (referenceEl === undefined) console.warn('trigger undefined');
		if (!reference && triggerEls.includes(ev.target) && referenceEl !== ev.target) {
			referenceEl = ev.target;
			block();
		}
		if (clickable && ev.type === 'focusin' && !open) block();
		open = clickable && ev.type === 'click' && !_blocked ? !open : true;
	};
	const hasHover = (el) => el.matches(':hover');
	const hasFocus = (el) => el.contains(document.activeElement);
	const px = (n) => (n != null ? `${n}px` : '');
	const hideHandler = (ev) => {
		if (activeContent) {
			setTimeout(() => {
				const elements = [referenceEl, floatingEl, ...triggerEls].filter(Boolean);
				if (ev.type === 'mouseleave' && elements.some(hasHover)) return;
				if (ev.type === 'focusout' && elements.some(hasFocus)) return;
				open = false;
			}, 100);
		} else open = false;
	};
	$: middleware = [...middlewares, dom.offset(+offset)];
	function updatePosition() {
		dom.computePosition(referenceEl, floatingEl, { placement, strategy, middleware }).then(({ x, y, middlewareData, placement, strategy }) => {
			floatingEl.style.position = strategy;
			floatingEl.style.left = yOnly ? '0' : px(x);
			floatingEl.style.top = px(y);
		});
	}
	function init(node, _referenceEl) {
		floatingEl = node;
		let cleanup = dom.autoUpdate(_referenceEl, floatingEl, updatePosition);
		return {
			update(_referenceEl) {
				cleanup();
				cleanup = dom.autoUpdate(_referenceEl, floatingEl, updatePosition);
			},
			destroy() {
				cleanup();
			}
		};
	}
	onMount(() => {
		const events = [
			['focusin', showHandler, true],
			['focusout', hideHandler, true],
			['click', showHandler, clickable],
			['mouseenter', showHandler, hoverable],
			['mouseleave', hideHandler, hoverable]
		];
		if (triggeredBy) triggerEls = [...document.querySelectorAll(triggeredBy)];
		else triggerEls = contentEl.previousElementSibling ? [contentEl.previousElementSibling] : [];
		if (!triggerEls.length) {
			// console.warn('No triggers found.');
		}
		triggerEls.forEach((element) => {
			if (element.tabIndex < 0) element.tabIndex = 0; // trigger must be focusable
			for (const [name, handler, cond] of events) if (cond) element.addEventListener(name, handler);
		});
		if (reference) {
			referenceEl = document.querySelector(reference) ?? document.body;
			if (referenceEl === document.body) {
				console.warn(`Popup reference not found: '${reference}'`);
			} else {
				referenceEl.addEventListener('focusout', hideHandler);
				if (hoverable) referenceEl.addEventListener('mouseleave', hideHandler);
			}
		} else {
			referenceEl = triggerEls[0];
		}
		return () => {
			// This is onDestroy function
			triggerEls.forEach((element) => {
				if (element) {
					for (const [name, handler] of events) element.removeEventListener(name, handler);
				}
			});
			if (referenceEl) {
				referenceEl.removeEventListener('focusout', hideHandler);
				referenceEl.removeEventListener('mouseleave', hideHandler);
			}
		};
	});
	function optional(pred, func) {
		return pred ? func : () => undefined;
	}
</script>

{#if !referenceEl}
	<div bind:this={contentEl} />
{/if}

{#if referenceEl}
	<Frame use={init} options={referenceEl} bind:open role="tooltip" tabindex={activeContent ? -1 : undefined} on:focusin={optional(activeContent, showHandler)} on:focusout={optional(activeContent, hideHandler)} on:mouseenter={optional(activeContent && !clickable, showHandler)} on:mouseleave={optional(activeContent && !clickable, hideHandler)} {...$$restProps}>
		<slot />
	</Frame>
{/if}

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let activeContent: boolean = false;
@prop export let offset: number = 8;
@prop export let placement: Placement = 'top';
@prop export let trigger: 'hover' | 'click' | 'focus' = 'hover';
@prop export let triggeredBy: string | undefined = undefined;
@prop export let reference: string | undefined = undefined;
@prop export let strategy: 'absolute' | 'fixed' = 'absolute';
@prop export let open: boolean = false;
@prop export let yOnly: boolean = false;
@prop export let middlewares: Middleware[] = [dom.flip(), dom.shift()];
-->
