// Simple load function - just passes the [root] url param through to the page as data.root
// e.g. visiting /root/سمو sets params.root to "سمو"
export const load = ({ params }) => {
	return { root: params.root };
};
