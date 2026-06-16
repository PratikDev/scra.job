import { api as convexApi } from "@/../convex/_generated/api";
import { DEFAULT_TRACKED_JOB_STATUS } from "@/../convex/schema";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import type { ScrapedJob, TrackedJob } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAction, useMutation, useQuery } from "convex/react";
import { RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { JobListItem } from "./JobListItem";
import { ScrapeSkeleton } from "./ScrapeSkeleton";

export function ScraperView() {
	const [scraping, setScraping] = useState(false);
	const [message, setMessage] = useState("Ready");
	const [error, setError] = useState("");
	const loadedJobs = useQuery(convexApi.jobs.listScrapedJobs, {});
	const scrapeJobs = useAction(convexApi.jobs.scrapeNow);
	const createFromScraped = useMutation(convexApi.trackedJobs.createFromScraped);
	const jobs = (loadedJobs ?? []) as ScrapedJob[];
	const loading = loadedJobs === undefined;

	useEffect(() => {
		if (!loading) setMessage("Ready");
	}, [loading]);

	async function scrapeNow() {
		setScraping(true);
		setError("");
		try {
			const result = await scrapeJobs();
			setMessage(
				`Scrape complete: ${result.inserted} new, ${result.updated} updated${
					result.errors.length ? `, ${result.errors.length} source issue(s)` : ""
				}`
			);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Scrape failed");
		} finally {
			setScraping(false);
		}
	}

	async function quickSave(job: ScrapedJob) {
		try {
			await createFromScraped({ id: job.id }) as TrackedJob;
			setMessage(`Saved ${job.title} to ${DEFAULT_TRACKED_JOB_STATUS}`);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not track job");
		}
	}

	const sortedJobs = useMemo(() => [...jobs].sort((jobA, jobB) => jobB.matchScore - jobA.matchScore), [jobs]);

	return (
		<div className="flex flex-col gap-5">
			{error ? (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			) : null}
			<Panel title="Aggregated Jobs" description={`${jobs.length} listings from public, unauthenticated sources`}>
				<div className="mb-4 flex items-center justify-between gap-3">
					<p className="text-xs text-zinc-400">{message}</p>
					<Button
						onClick={() => void scrapeNow()}
						disabled={scraping}
						className="rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
					>
						<RefreshCwIcon data-icon="inline-start" className={cn(scraping && "animate-spin")} />
						Scrape Now
					</Button>
				</div>
			</Panel>

			<div className="flex flex-col gap-3">
				{scraping ? <ScrapeSkeleton /> : null}
				{!scraping &&
					sortedJobs.map((job) => (
						<JobListItem key={job.id} job={job} onTrack={() => void quickSave(job)} />
					))}
				{!loading && !scraping && jobs.length === 0 ? (
					<EmptyState action="Scrape now" onClick={() => void scrapeNow()}>
						No listings yet. Pull fresh jobs from the configured public sources.
					</EmptyState>
				) : null}
			</div>
		</div>
	);
}
