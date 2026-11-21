// Max age shown as relative time,
// older show the date
const maxRelativeDays = 7;

// Short version of timeAgo, for places with little room:
// "Just now", "3m ago", "1hr ago", "2d ago" up to 7 days, then "Nov 10" ("May 12, 2025" for past years)
export function shortTimeAgo(timestamp, now = Date.now()) {
	if (!timestamp) return null;

	const minutes = Math.floor((now - timestamp) / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}hr ago`;
	if (days <= maxRelativeDays) return `${days}d ago`;

	const date = new Date(timestamp);
	const sameYear = date.getFullYear() === new Date(now).getFullYear();
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}
