import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DashboardView } from "@/components/DashboardView";

export const Route = createFileRoute("/dashboard")({
	component: DashboardRoute,
});

function DashboardRoute() {
	return (
		<AppShell activeView="dashboard">
			<DashboardView />
		</AppShell>
	);
}
