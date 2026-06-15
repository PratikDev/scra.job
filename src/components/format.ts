export function formatDate(value: string | number | null) {
	if (!value) return "Unknown";
	return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
		new Date(value)
	);
}
