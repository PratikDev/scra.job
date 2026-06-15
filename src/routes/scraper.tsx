import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ScraperView } from "@/components/ScraperView";

export const Route = createFileRoute("/scraper")({
	component: ScraperRoute,
});

function ScraperRoute() {
	return (
		<AppShell activeView="scraper">
			<ScraperView />
		</AppShell>
	);
}
