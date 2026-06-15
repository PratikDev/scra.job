import { CompanyLogo } from "@/components/CompanyLogo";
import { ScoreBadge } from "@/components/ScoreBadge";
import type { ScrapedJob } from "@/lib/types";

export function JobCompact({ job }: { job: ScrapedJob }) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
			<CompanyLogo name={job.company} />
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-zinc-100">{job.title}</div>
				<div className="truncate text-xs text-zinc-500">{job.company}</div>
			</div>
			<ScoreBadge score={job.matchScore} />
		</div>
	);
}
