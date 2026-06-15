import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
	title,
	value,
	detail,
	icon: Icon,
}: {
	title: string;
	value: string | number;
	detail: string;
	icon: LucideIcon;
}) {
	return (
		<Card className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-4">
					<CardDescription className="text-xs text-zinc-400">{title}</CardDescription>
					<div className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-indigo-400">
						<Icon />
					</div>
				</div>
				<CardTitle className="text-3xl font-semibold tracking-normal text-zinc-50">{value}</CardTitle>
			</CardHeader>
			<CardContent className="text-xs text-zinc-500">{detail}</CardContent>
		</Card>
	);
}
