import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2Icon, PlusIcon, SaveIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { api as convexApi } from "../../../convex/_generated/api";
import { DEFAULT_TRACKED_JOB_STATUS, TRACKED_JOB_STATUSES } from "../../../convex/schema";
import { acceptedJobSourceLabel, isAcceptedJobSourceUrl } from "@/lib/acceptedJobSources";
import type { Status, TrackedJob } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";

type UrlImportDraft = {
	url: string;
	notes: string;
	dateApplied: string;
	status: Status;
};

const emptyDraft: UrlImportDraft = {
	url: "",
	notes: "",
	dateApplied: "",
	status: DEFAULT_TRACKED_JOB_STATUS,
};

export function TrackerView() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [draft, setDraft] = useState<UrlImportDraft>(emptyDraft);
	const [error, setError] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const loadedTrackedJobs = useQuery(convexApi.trackedJobs.list, {});
	const importFromUrl = useAction(convexApi.trackedJobs.createFromUrl);
	const updateTrackedJob = useMutation(convexApi.trackedJobs.update);
	const trackedJobs = (loadedTrackedJobs ?? []) as TrackedJob[];

	async function importJobFromUrl() {
		if (!draft.url.trim()) {
			toast.error("Add a job link before saving.");
			return;
		}
		if (!isAcceptedJobSourceUrl(draft.url)) {
			toast.error("Unsupported job source", {
				description: `Use a link from: ${acceptedJobSourceLabel()}.`,
			});
			return;
		}

		try {
			setError("");
			setIsImporting(true);
			const tracked = await importFromUrl(draft) as TrackedJob;
			setDraft(emptyDraft);
			setDialogOpen(false);
			toast.success("Job imported to tracker", {
				description: `${tracked.title} at ${tracked.company}`,
			});
		} catch (caught) {
			const message = caught instanceof Error ? caught.message : "Could not import job";
			setError(message);
			toast.error("Could not import job", { description: message });
		} finally {
			setIsImporting(false);
		}
	}

	async function updateStatus(job: TrackedJob, status: Status) {
		await updateTrackedJob({ id: job.id, status });
	}

	const jobsByStatus = useMemo(
		() =>
			TRACKED_JOB_STATUSES.reduce<Record<Status, TrackedJob[]>>(
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
							<DialogTitle>Import tracked job</DialogTitle>
							<DialogDescription className="text-zinc-400">
								Paste a supported job link and Scra.job will scrape the title, company, and salary details.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4">
							<Field label="Job URL">
								<DarkInput
									placeholder="https://www.ycombinator.com/companies/..."
									value={draft.url}
									onChange={(event) => setDraft({ ...draft, url: event.target.value })}
								/>
							</Field>
							<div className="grid gap-4 md:grid-cols-2">
								<Field label="Date Applied">
									<DarkInput
										type="date"
										value={draft.dateApplied}
										onChange={(event) => setDraft({ ...draft, dateApplied: event.target.value })}
									/>
								</Field>
								<Field label="Status">
									<StatusSelect value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
								</Field>
							</div>
							<div>
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
							<Button
								onClick={() => void importJobFromUrl()}
								disabled={isImporting}
								className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70"
							>
								{isImporting ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
								{isImporting ? "Importing..." : "Import Job"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
				{TRACKED_JOB_STATUSES.map((status) => (
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
