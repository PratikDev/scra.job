import type React from "react";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import type { ActiveView } from "@/lib/types";

export function AppShell({
	activeView,
	children,
}: {
	activeView: ActiveView;
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<div className="flex min-h-screen">
				<Sidebar activeView={activeView} />
				<main className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6">
					<div className="mx-auto flex max-w-7xl flex-col gap-6">
						<PageHeader activeView={activeView} />
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
