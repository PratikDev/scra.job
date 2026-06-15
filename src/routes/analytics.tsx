import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AnalyticsView } from "@/components/AnalyticsView";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsRoute,
});

function AnalyticsRoute() {
	return (
		<AppShell activeView="analytics">
			<AnalyticsView />
		</AppShell>
	);
}
