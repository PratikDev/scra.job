import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ScoreBadge } from "@/components/ScoreBadge";
import { formatDate } from "@/components/format";
import type { ScrapedJob } from "@/lib/types";

export function JobListItem({ job, onTrack }: { job: ScrapedJob; onTrack: () => void }) {
	return (
		<div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/90">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 gap-4">
					<CompanyLogo name={job.company} />
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<a href={job.url} target="_blank" rel="noreferrer" className="font-medium text-zinc-50 hover:text-indigo-300">
								{job.title}
							</a>
							<ScoreBadge score={job.matchScore} />
						</div>
						<div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
							<span>{job.company}</span>
							<span>•</span>
							<span>{job.source}</span>
							<span>•</span>
							<span>{formatDate(job.datePosted)}</span>
						</div>
						<p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{job.description}</p>
					</div>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={onTrack}
					className="rounded-xl border-zinc-800 bg-zinc-950 text-zinc-200 transition-all duration-200 hover:bg-indigo-600 hover:text-white"
				>
					<DownloadIcon data-icon="inline-start" />
					Track
				</Button>
			</div>
		</div>
	);
}
