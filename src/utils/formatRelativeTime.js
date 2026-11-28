// Formats a timestamp as a compact relative time ("Just now", "3m ago", "1hr ago", "2d ago")
// Anything older than 7 days falls back to a date ("Nov 10", or "May 12, 2025" for past years)
// Accepts a ms number, Date object or date string, and returns null for missing/invalid input
export function formatRelativeTime(timestamp, now = Date.now()) {
	// Max age shown as relative time, older show the date
	const maxRelativeDays = 7;

	const time = new Date(timestamp).getTime();
	if (!timestamp || Number.isNaN(time)) return null;

	const minutes = Math.floor((now - time) / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}hr ago`;
	if (days <= maxRelativeDays) return `${days}d ago`;

	const date = new Date(time);
	const sameYear = date.getFullYear() === new Date(now).getFullYear();
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}
