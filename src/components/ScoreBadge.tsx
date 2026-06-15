import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number }) {
	return (
		<span
			className={cn(
				"rounded-full border px-2 py-1 text-xs font-medium",
				score >= 50
					? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
					: "border-zinc-800 bg-zinc-950 text-zinc-400"
			)}
		>
			{score}% match
		</span>
	);
}
