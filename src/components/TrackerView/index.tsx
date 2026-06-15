import { PlusIcon, SaveIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DarkInput } from "@/components/DarkInput";
import { DarkTextarea } from "@/components/DarkTextarea";
import { Field } from "@/components/Field";
import { StatusSelect } from "@/components/StatusSelect";
import { api } from "@/lib/api";
import { STATUSES, type DraftJob, type Status, type TrackedJob } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";

const emptyDraft: DraftJob = {
	title: "",
	company: "",
	salaryRange: "",
	url: "",
	notes: "",
	dateApplied: "",
	status: "To Apply",
};

export function TrackerView() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [draft, setDraft] = useState<DraftJob>(emptyDraft);
	const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadTrackedJobs() {
			try {
				setTrackedJobs(await api<TrackedJob[]>("/api/tracked-jobs"));
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Failed to load tracked jobs");
			}
		}

		void loadTrackedJobs();
	}, []);

	async function addManualJob() {
		if (!draft.title.trim() || !draft.company.trim()) {
			setError("Job title and company are required");
			return;
		}

		try {
			const tracked = await api<TrackedJob>("/api/tracked-jobs", {
				method: "POST",
				body: JSON.stringify(draft),
			});
			setTrackedJobs((current) => [tracked, ...current]);
			setDraft(emptyDraft);
			setDialogOpen(false);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not add job");
		}
	}

	async function updateStatus(job: TrackedJob, status: Status) {
		const updated = await api<TrackedJob>(`/api/tracked-jobs/${job.id}`, {
			method: "PATCH",
			body: JSON.stringify({ status }),
		});
		setTrackedJobs((current) => current.map((item) => (item.id === updated.id ? updated : item)));
	}

	const jobsByStatus = useMemo(
		() =>
			STATUSES.reduce<Record<Status, TrackedJob[]>>(
				(groups, status) => ({ ...groups, [status]: trackedJobs.filter((job) => job.status === status) }),
				{} as Record<Status, TrackedJob[]>
			),
		[trackedJobs]
	);

	return (
		<div className="flex flex-col gap-5">
			{error ? (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			) : null}
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-zinc-50">Application pipeline</h2>
					<p className="text-sm text-zinc-400">Clean lanes with fast status movement.</p>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button className="rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500">
							<PlusIcon data-icon="inline-start" />
							Add Job
						</Button>
					</DialogTrigger>
					<DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Add tracked job</DialogTitle>
							<DialogDescription className="text-zinc-400">Create a manual application record.</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Job Title">
								<DarkInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
							</Field>
							<Field label="Company">
								<DarkInput value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} />
							</Field>
							<Field label="Salary Range">
								<DarkInput
									value={draft.salaryRange}
									onChange={(event) => setDraft({ ...draft, salaryRange: event.target.value })}
								/>
							</Field>
							<Field label="Date Applied">
								<DarkInput
									type="date"
									value={draft.dateApplied}
									onChange={(event) => setDraft({ ...draft, dateApplied: event.target.value })}
								/>
							</Field>
							<Field label="Job URL">
								<DarkInput value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
							</Field>
							<Field label="Status">
								<StatusSelect value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
							</Field>
							<div className="md:col-span-2">
								<Field label="Notes">
									<DarkTextarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
								</Field>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDialogOpen(false)}
								className="rounded-xl border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 hover:text-white"
							>
								Cancel
							</Button>
							<Button onClick={() => void addManualJob()} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
								<SaveIcon data-icon="inline-start" />
								Save Job
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
			<div className="grid gap-4 xl:grid-cols-5">
				{STATUSES.map((status) => (
					<section key={status} className="flex min-h-96 flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/45 p-3">
						<div className="flex items-center justify-between gap-2 px-1">
							<h3 className="text-sm font-semibold text-zinc-200">{status}</h3>
							<span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-400">
								{jobsByStatus[status].length}
							</span>
						</div>
						{jobsByStatus[status].map((job) => (
							<KanbanCard key={job.id} job={job} updateStatus={(nextJob, nextStatus) => void updateStatus(nextJob, nextStatus)} />
						))}
					</section>
				))}
			</div>
		</div>
	);
}
