import { get } from 'svelte/store';
import { __lastRead } from '$utils/stores';
import { updateSettings } from '$utils/updateSettings';

const visibleVerses = new Map();
const versePosition = (meta) => meta.chapter * 1000 + meta.verse;

// Stores the furthest verse currently on screen as the last read one.
export function trackReadingPosition(meta, { inView, node }) {
	if (inView) visibleVerses.set(node, meta);
	else visibleVerses.delete(node);

	let furthestVerse = null;

	for (const [verseNode, verseMeta] of visibleVerses) {
		if (!verseNode.isConnected) {
			visibleVerses.delete(verseNode);
			continue;
		}

		if (furthestVerse === null || versePosition(verseMeta) > versePosition(furthestVerse)) {
			furthestVerse = verseMeta;
		}
	}

	if (furthestVerse === null) {
		return;
	}
	const lastRead = get(__lastRead);
	if (lastRead?.chapter === furthestVerse.chapter && lastRead?.verse === furthestVerse.verse) {
		return;
	}

	updateSettings({ type: 'lastRead', value: furthestVerse });
}
