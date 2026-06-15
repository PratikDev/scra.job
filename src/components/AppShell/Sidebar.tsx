import { Link } from "@tanstack/react-router";
import { CircleUserRoundIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";
import type { ActiveView } from "@/lib/types";

export function Sidebar({ activeView }: { activeView: ActiveView }) {
	return (
		<aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/95 px-3 py-4 lg:flex lg:flex-col">
			<div className="flex items-center gap-3 px-3 py-2">
				<div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/50">
					<SparklesIcon />
				</div>
				<div>
					<div className="text-sm font-semibold text-zinc-100">Scra.job</div>
					<div className="text-xs text-zinc-500">Remote Ops Suite</div>
				</div>
			</div>

			<nav className="mt-8 flex flex-col gap-1">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const active = activeView === item.id;
					return (
						<Link
							key={item.id}
							to={item.to}
							className={cn(
								"flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-zinc-900 hover:text-zinc-100",
								active && "bg-zinc-900 text-indigo-300 ring-1 ring-zinc-800"
							)}
						>
							<Icon />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
						<CircleUserRoundIcon />
					</div>
					<div className="min-w-0">
						<div className="truncate text-sm font-medium text-zinc-100">Local workspace</div>
						<div className="text-xs text-zinc-500">SQLite enabled</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
