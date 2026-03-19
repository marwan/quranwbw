<script>
	export let value;
	export let textSize = '7px';

	const svgData = `<path class="opacity-15" d="M21.77,8.948a1.238,1.238,0,0,1-.7-1.7,3.239,3.239,0,0,0-4.315-4.316,1.239,1.239,0,0,1-1.7-.7,3.239,3.239,0,0,0-6.1,0,1.238,1.238,0,0,1-1.7.7A3.239,3.239,0,0,0,2.934,7.249a1.237,1.237,0,0,1-.7,1.7,3.24,3.24,0,0,0,0,6.1,1.238,1.238,0,0,1,.705,1.7A3.238,3.238,0,0,0,7.25,21.066a1.238,1.238,0,0,1,1.7.7,3.239,3.239,0,0,0,6.1,0,1.238,1.238,0,0,1,1.7-.7,3.239,3.239,0,0,0,4.316-4.315,1.239,1.239,0,0,1,.7-1.7,3.239,3.239,0,0,0,0-6.1Z" />`;
</script>

<svg class="w-10 h-10 rounded-full flex items-center justify-center" fill={window.theme('icon')} viewBox="0 0 24 24">
	{@html svgData}
	<text x="50%" y="53%" text-anchor="middle" stroke={window.theme('icon')} stroke-width="0.5px" dy=".3em" class="text" style="font-size: {textSize};">{value}</text>
</svg>
