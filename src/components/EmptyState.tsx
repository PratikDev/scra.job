import { Link } from "@tanstack/react-router";
import type React from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({
	children,
	action,
	to,
	onClick,
}: {
	children: React.ReactNode;
	action: string;
	to?: "/dashboard" | "/scraper" | "/tracker" | "/profile" | "/analytics";
	onClick?: () => void;
}) {
	const actionClassName =
		"mt-4 rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500";

	return (
		<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/45 p-8 text-center">
			<p className="text-sm text-zinc-400">{children}</p>
			{to ? (
				<Button asChild className={actionClassName}>
					<Link to={to}>{action}</Link>
				</Button>
			) : (
				<Button onClick={onClick} className={actionClassName}>
					{action}
				</Button>
			)}
		</div>
	);
}
