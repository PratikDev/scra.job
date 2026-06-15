import { useEffect, useMemo, useState } from "react";
import { ListFilterIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DarkInput } from "@/components/DarkInput";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { JobFilters, ScrapedJob, TrackedJob } from "@/lib/types";
import { cn } from "@/lib/utils";
import { JobListItem } from "./JobListItem";
import { ScrapeSkeleton } from "./ScrapeSkeleton";

const emptyFilters: JobFilters = {
	title: "",
	company: "",
	from: "",
	to: "",
};

export function ScraperView() {
	const [filters, setFilters] = useState<JobFilters>(emptyFilters);
	const [jobs, setJobs] = useState<ScrapedJob[]>([]);
	const [loading, setLoading] = useState(true);
	const [scraping, setScraping] = useState(false);
	const [message, setMessage] = useState("Ready");
	const [error, setError] = useState("");

	async function loadJobs(nextFilters = filters) {
		const params = new URLSearchParams();
		if (nextFilters.title) params.set("title", nextFilters.title);
		if (nextFilters.company) params.set("company", nextFilters.company);
		if (nextFilters.from) params.set("from", nextFilters.from);
		if (nextFilters.to) params.set("to", nextFilters.to);
		const query = params.toString();
		const loadedJobs = await api<ScrapedJob[]>(`/api/jobs${query ? `?${query}` : ""}`);
		setJobs(loadedJobs);
	}

	useEffect(() => {
		async function loadInitialJobs() {
			setError("");
			try {
				await loadJobs(emptyFilters);
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Failed to load jobs");
			} finally {
				setLoading(false);
			}
		}

		void loadInitialJobs();
	}, []);

	async function applyFilters() {
		setError("");
		try {
			await loadJobs();
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Failed to filter jobs");
		}
	}

	async function scrapeNow() {
		setScraping(true);
		setError("");
		try {
			const result = await api<{ inserted: number; updated: number; errors: { source: string; message: string }[] }>(
				"/api/scrape",
				{ method: "POST" }
			);
			await loadJobs();
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
			await api<TrackedJob>(`/api/tracked-jobs/from-scraped/${job.id}`, { method: "POST" });
			setMessage(`Saved ${job.title} to To Apply`);
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
				<div className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_10rem_auto]">
					<DarkInput
						placeholder="Job title"
						value={filters.title}
						onChange={(event) => setFilters({ ...filters, title: event.target.value })}
					/>
					<DarkInput
						placeholder="Company"
						value={filters.company}
						onChange={(event) => setFilters({ ...filters, company: event.target.value })}
					/>
					<DarkInput
						type="date"
						value={filters.from}
						onChange={(event) => setFilters({ ...filters, from: event.target.value })}
					/>
					<DarkInput
						type="date"
						value={filters.to}
						onChange={(event) => setFilters({ ...filters, to: event.target.value })}
					/>
					<Button
						variant="outline"
						onClick={() => void applyFilters()}
						className="rounded-xl border-zinc-800 bg-zinc-950 text-zinc-200 transition-all duration-200 hover:bg-zinc-900 hover:text-white"
					>
						<ListFilterIcon data-icon="inline-start" />
						Filter
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
