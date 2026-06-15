import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TrackerView } from "@/components/TrackerView";

export const Route = createFileRoute("/tracker")({
	component: TrackerRoute,
});

function TrackerRoute() {
	return (
		<AppShell activeView="tracker">
			<TrackerView />
		</AppShell>
	);
}
