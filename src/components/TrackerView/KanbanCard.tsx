import { CompanyLogo } from "@/components/CompanyLogo";
import { StatusSelect } from "@/components/StatusSelect";
import { formatDate } from "@/components/format";
import type { Status, TrackedJob } from "@/lib/types";

export function KanbanCard({ job, updateStatus }: { job: TrackedJob; updateStatus: (job: TrackedJob, status: Status) => void }) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/30">
			<div className="flex gap-3">
				<CompanyLogo name={job.company} small />
				<div className="min-w-0">
					<a
						href={job.url ?? undefined}
						target="_blank"
						rel="noreferrer"
						className="line-clamp-2 text-sm font-medium text-zinc-100 hover:text-indigo-300"
					>
						{job.title}
					</a>
					<div className="mt-1 text-xs text-zinc-500">{job.company}</div>
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				<span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
					{job.salaryRange || "Salary TBD"}
				</span>
				<span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">
					{job.dateApplied ? formatDate(job.dateApplied) : "Not applied"}
				</span>
			</div>
			{job.notes ? <p className="line-clamp-3 text-xs leading-5 text-zinc-500">{job.notes}</p> : null}
			<StatusSelect value={job.status} onChange={(nextStatus) => updateStatus(job, nextStatus)} />
		</div>
	);
}
