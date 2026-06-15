import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ActiveView } from "@/lib/types";
import { NAV_ITEMS } from "./navItems";

export function PageHeader({
	activeView,
}: {
	activeView: ActiveView;
}) {
	const title =
		activeView === "dashboard"
			? "Dashboard"
			: activeView.charAt(0).toUpperCase() + activeView.slice(1);

	return (
		<header className="sticky top-0 z-30 -mx-4 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur-xl md:-mx-8 md:px-8 lg:static lg:mx-0 lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="text-xs font-medium uppercase text-indigo-400">Remote intelligence</div>
					<h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-50 md:text-3xl">{title}</h1>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-5 gap-1 lg:hidden">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const active = activeView === item.id;
					return (
						<Link
							key={item.id}
							to={item.to}
							className={cn(
								"flex h-10 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-all duration-200 hover:bg-zinc-900 hover:text-zinc-100",
								active && "border-zinc-800 bg-zinc-900 text-indigo-300"
							)}
							aria-label={item.label}
						>
							<Icon />
						</Link>
					);
				})}
			</div>
		</header>
	);
}
