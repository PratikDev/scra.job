import { createFileRoute } from "@tanstack/react-router";
import {
	ArcElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions, ScriptableContext } from "chart.js";
import {
	ActivityIcon,
	BarChart3Icon,
	BriefcaseBusinessIcon,
	CheckCircle2Icon,
	CircleUserRoundIcon,
	DownloadIcon,
	LayoutDashboardIcon,
	ListFilterIcon,
	PlusIcon,
	RefreshCwIcon,
	SaveIcon,
	SearchIcon,
	SparklesIcon,
	TargetIcon,
	UserRoundIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

export const Route = createFileRoute("/")({ component: App });

const STATUSES = ["To Apply", "Applied", "Interviewing", "Offer", "Rejected"] as const;
const NAV_ITEMS = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
	{ id: "scraper", label: "Scraper", icon: SearchIcon },
	{ id: "tracker", label: "Tracker", icon: BriefcaseBusinessIcon },
	{ id: "profile", label: "Profile", icon: UserRoundIcon },
	{ id: "analytics", label: "Analytics", icon: BarChart3Icon },
] as const;

type Status = (typeof STATUSES)[number];
type ActiveView = (typeof NAV_ITEMS)[number]["id"];

type ScrapedJob = {
	id: number;
	source: string;
	title: string;
	company: string;
	location: string;
	url: string;
	description: string;
	datePosted: string | null;
	salaryRange: string | null;
	matchScore: number;
};

type TrackedJob = {
	id: number;
	title: string;
	company: string;
	salaryRange: string | null;
	url: string | null;
	notes: string | null;
	dateApplied: string | null;
	status: Status;
};

type Analytics = {
	totalTracked: number;
	totalApplied: number;
	interviewConversionRate: number;
	statusCounts: Record<Status, number>;
	applicationsOverTime: { date: string; count: number }[];
};

type DraftJob = {
	title: string;
	company: string;
	salaryRange: string;
	url: string;
	notes: string;
	dateApplied: string;
	status: Status;
};

const emptyDraft: DraftJob = {
	title: "",
	company: "",
	salaryRange: "",
	url: "",
	notes: "",
	dateApplied: "",
	status: "To Apply",
};

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:4000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_ORIGIN}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(body.error || "Request failed");
	}

	return response.json() as Promise<T>;
}

function formatDate(value: string | null) {
	if (!value) return "Unknown";
	return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
		new Date(value)
	);
}

function App() {
	const [activeView, setActiveView] = useState<ActiveView>("dashboard");
	const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);
	const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [resumeText, setResumeText] = useState("");
	const [filters, setFilters] = useState({ title: "", company: "", from: "", to: "" });
	const [draft, setDraft] = useState<DraftJob>(emptyDraft);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [scraping, setScraping] = useState(false);
	const [message, setMessage] = useState("Ready");
	const [error, setError] = useState("");

	async function loadJobs() {
		const params = new URLSearchParams();
		if (filters.title) params.set("title", filters.title);
		if (filters.company) params.set("company", filters.company);
		if (filters.from) params.set("from", filters.from);
		if (filters.to) params.set("to", filters.to);
		const query = params.toString();
		const jobs = await api<ScrapedJob[]>(`/api/jobs${query ? `?${query}` : ""}`);
		setScrapedJobs(jobs);
	}

	async function loadAll() {
		setError("");
		try {
			const [jobs, tracked, profile, stats] = await Promise.all([
				api<ScrapedJob[]>("/api/jobs"),
				api<TrackedJob[]>("/api/tracked-jobs"),
				api<{ resumeText: string }>("/api/profile"),
				api<Analytics>("/api/analytics"),
			]);
			setScrapedJobs(jobs);
			setTrackedJobs(tracked);
			setResumeText(profile.resumeText);
			setAnalytics(stats);
			setMessage("Dashboard loaded");
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Failed to load dashboard");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadAll();
	}, []);

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
			const tracked = await api<TrackedJob>(`/api/tracked-jobs/from-scraped/${job.id}`, { method: "POST" });
			setTrackedJobs((current) => [tracked, ...current]);
			const stats = await api<Analytics>("/api/analytics");
			setAnalytics(stats);
			setMessage(`Saved ${job.title} to To Apply`);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not track job");
		}
	}

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
			setAnalytics(await api<Analytics>("/api/analytics"));
			setMessage("Manual job added");
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
		setAnalytics(await api<Analytics>("/api/analytics"));
	}

	async function saveProfile() {
		try {
			await api<{ resumeText: string }>("/api/profile", {
				method: "PUT",
				body: JSON.stringify({ resumeText }),
			});
			await loadJobs();
			setMessage("Profile saved and match scores refreshed");
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not save profile");
		}
	}

	const jobsByStatus = useMemo(
		() =>
			STATUSES.reduce<Record<Status, TrackedJob[]>>(
				(groups, status) => ({ ...groups, [status]: trackedJobs.filter((job) => job.status === status) }),
				{} as Record<Status, TrackedJob[]>
			),
		[trackedJobs]
	);

	const topMatches = useMemo(
		() => [...scrapedJobs].sort((jobA, jobB) => jobB.matchScore - jobA.matchScore).slice(0, 4),
		[scrapedJobs]
	);

	const statusChart = useMemo(
		() => ({
			labels: STATUSES,
			datasets: [
				{
					data: STATUSES.map((status) => analytics?.statusCounts[status] ?? 0),
					backgroundColor: ["#4f46e5", "#6366f1", "#8b5cf6", "#22c55e", "#ef4444"],
					borderColor: "#18181b",
					borderWidth: 2,
					hoverOffset: 6,
				},
			],
		}),
		[analytics]
	);

	const applicationChart = useMemo(
		() => ({
			labels: analytics?.applicationsOverTime.map((item) => item.date) ?? [],
			datasets: [
				{
					label: "Applications",
					data: analytics?.applicationsOverTime.map((item) => item.count) ?? [],
					borderColor: "#818cf8",
					backgroundColor: (context: ScriptableContext<"line">) => {
						const area = context.chart.chartArea;
						if (!area) return "rgba(99,102,241,0.2)";
						const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
						gradient.addColorStop(0, "rgba(99,102,241,0.35)");
						gradient.addColorStop(1, "rgba(99,102,241,0)");
						return gradient;
					},
					fill: true,
					tension: 0.38,
					pointBackgroundColor: "#c7d2fe",
					pointBorderColor: "#4f46e5",
					pointRadius: 4,
				},
			],
		}),
		[analytics]
	);

	const chartOptions: ChartOptions<"line"> = {
		maintainAspectRatio: false,
		plugins: {
			legend: { labels: { color: "#a1a1aa", boxWidth: 10, boxHeight: 10 } },
			tooltip: { backgroundColor: "#18181b", borderColor: "#3f3f46", borderWidth: 1 },
		},
		scales: {
			x: { grid: { color: "rgba(63,63,70,0.35)" }, ticks: { color: "#71717a" } },
			y: { grid: { color: "rgba(63,63,70,0.35)" }, ticks: { color: "#71717a", precision: 0 } },
		},
	};

	const doughnutOptions: ChartOptions<"doughnut"> = {
		maintainAspectRatio: false,
		cutout: "68%",
		plugins: {
			legend: { position: "bottom", labels: { color: "#a1a1aa", boxWidth: 10, boxHeight: 10 } },
			tooltip: { backgroundColor: "#18181b", borderColor: "#3f3f46", borderWidth: 1 },
		},
	};

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<div className="flex min-h-screen">
				<Sidebar activeView={activeView} setActiveView={setActiveView} />
				<main className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6">
					<div className="mx-auto flex max-w-7xl flex-col gap-6">
						<PageHeader
							activeView={activeView}
							setActiveView={setActiveView}
							loading={loading}
							message={message}
							scraping={scraping}
							onScrape={() => void scrapeNow()}
						/>

						{error ? (
							<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
								{error}
							</div>
						) : null}

						{activeView === "dashboard" ? (
							<DashboardView
								analytics={analytics}
								scrapedJobs={scrapedJobs}
								trackedJobs={trackedJobs}
								topMatches={topMatches}
								applicationChart={applicationChart}
								chartOptions={chartOptions}
								setActiveView={setActiveView}
							/>
						) : null}

						{activeView === "scraper" ? (
							<ScraperView
								filters={filters}
								setFilters={setFilters}
								jobs={scrapedJobs}
								loading={loading}
								scraping={scraping}
								loadJobs={() => void loadJobs()}
								quickSave={(job) => void quickSave(job)}
								scrapeNow={() => void scrapeNow()}
							/>
						) : null}

						{activeView === "tracker" ? (
							<TrackerView
								dialogOpen={dialogOpen}
								setDialogOpen={setDialogOpen}
								draft={draft}
								setDraft={setDraft}
								jobsByStatus={jobsByStatus}
								addManualJob={() => void addManualJob()}
								updateStatus={(job, status) => void updateStatus(job, status)}
							/>
						) : null}

						{activeView === "profile" ? (
							<ProfileView resumeText={resumeText} setResumeText={setResumeText} saveProfile={() => void saveProfile()} />
						) : null}

						{activeView === "analytics" ? (
							<AnalyticsView
								analytics={analytics}
								statusChart={statusChart}
								applicationChart={applicationChart}
								chartOptions={chartOptions}
								doughnutOptions={doughnutOptions}
							/>
						) : null}
					</div>
				</main>
			</div>
		</div>
	);
}

function Sidebar({
	activeView,
	setActiveView,
}: {
	activeView: ActiveView;
	setActiveView: (view: ActiveView) => void;
}) {
	return (
		<aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/95 px-3 py-4 lg:flex lg:flex-col">
			<div className="flex items-center gap-3 px-3 py-2">
				<div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/50">
					<SparklesIcon />
				</div>
				<div>
					<div className="text-sm font-semibold text-zinc-100">Scra.job</div>
					<div className="text-xs text-zinc-500">Remote Ops Suite</div>
				</div>
			</div>

			<nav className="mt-8 flex flex-col gap-1">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const active = activeView === item.id;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => setActiveView(item.id)}
							className={cn(
								"flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-zinc-900 hover:text-zinc-100",
								active && "bg-zinc-900 text-indigo-300 ring-1 ring-zinc-800"
							)}
						>
							<Icon />
							{item.label}
						</button>
					);
				})}
			</nav>

			<div className="mt-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
						<CircleUserRoundIcon />
					</div>
					<div className="min-w-0">
						<div className="truncate text-sm font-medium text-zinc-100">Local workspace</div>
						<div className="text-xs text-zinc-500">SQLite enabled</div>
					</div>
				</div>
			</div>
		</aside>
	);
}

function PageHeader({
	activeView,
	setActiveView,
	loading,
	message,
	scraping,
	onScrape,
}: {
	activeView: ActiveView;
	setActiveView: (view: ActiveView) => void;
	loading: boolean;
	message: string;
	scraping: boolean;
	onScrape: () => void;
}) {
	const title =
		activeView === "dashboard"
			? "Dashboard"
			: activeView.charAt(0).toUpperCase() + activeView.slice(1);
	return (
		<header className="sticky top-0 z-30 -mx-4 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur-xl md:-mx-8 md:px-8 lg:static lg:mx-0 lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<div className="text-xs font-medium uppercase text-indigo-400">Remote intelligence</div>
					<h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-50 md:text-3xl">{title}</h1>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
						{loading ? "Syncing workspace" : message}
					</div>
					<Button
						onClick={onScrape}
						disabled={scraping}
						className="rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
					>
						<RefreshCwIcon data-icon="inline-start" className={cn(scraping && "animate-spin")} />
						Scrape Now
					</Button>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-5 gap-1 lg:hidden">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					const active = activeView === item.id;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => setActiveView(item.id)}
							className={cn(
								"flex h-10 items-center justify-center rounded-xl border border-transparent text-zinc-500 transition-all duration-200 hover:bg-zinc-900 hover:text-zinc-100",
								active && "border-zinc-800 bg-zinc-900 text-indigo-300"
							)}
							aria-label={item.label}
						>
							<Icon />
						</button>
					);
				})}
			</div>
		</header>
	);
}

function DashboardView({
	analytics,
	scrapedJobs,
	trackedJobs,
	topMatches,
	applicationChart,
	chartOptions,
	setActiveView,
}: {
	analytics: Analytics | null;
	scrapedJobs: ScrapedJob[];
	trackedJobs: TrackedJob[];
	topMatches: ScrapedJob[];
	applicationChart: ChartData<"line">;
	chartOptions: ChartOptions<"line">;
	setActiveView: (view: ActiveView) => void;
}) {
	const pendingJobs = trackedJobs.filter((job) => job.status === "To Apply").length;
	return (
		<div className="flex flex-col gap-5">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard title="Scraped Jobs" value={scrapedJobs.length} detail="Public listings indexed" icon={SearchIcon} />
				<MetricCard title="Tracked" value={analytics?.totalTracked ?? 0} detail="Applications in pipeline" icon={TargetIcon} />
				<MetricCard title="To Apply" value={pendingJobs} detail="Open action queue" icon={ActivityIcon} />
				<MetricCard
					title="Interview Rate"
					value={`${analytics?.interviewConversionRate ?? 0}%`}
					detail="Applied to interview"
					icon={CheckCircle2Icon}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
				<Panel title="Application Momentum" description="Date-applied trend from your tracker">
					<div className="h-80">
						<Line data={applicationChart} options={chartOptions} />
					</div>
				</Panel>
				<Panel title="Best Resume Matches" description="Highest scoring scraped roles">
					<div className="flex flex-col gap-3">
						{topMatches.map((job) => (
							<JobCompact key={job.id} job={job} />
						))}
						{topMatches.length === 0 ? (
							<EmptyState action="Open scraper" onClick={() => setActiveView("scraper")}>
								Run a scrape to surface match-ranked jobs.
							</EmptyState>
						) : null}
					</div>
				</Panel>
			</div>
		</div>
	);
}

function ScraperView({
	filters,
	setFilters,
	jobs,
	loading,
	scraping,
	loadJobs,
	quickSave,
	scrapeNow,
}: {
	filters: { title: string; company: string; from: string; to: string };
	setFilters: (filters: { title: string; company: string; from: string; to: string }) => void;
	jobs: ScrapedJob[];
	loading: boolean;
	scraping: boolean;
	loadJobs: () => void;
	quickSave: (job: ScrapedJob) => void;
	scrapeNow: () => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<Panel title="Aggregated Jobs" description={`${jobs.length} listings from public, unauthenticated sources`}>
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
						onClick={loadJobs}
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
					jobs.map((job) => (
						<JobListItem key={job.id} job={job} onTrack={() => quickSave(job)} />
					))}
				{!loading && !scraping && jobs.length === 0 ? (
					<EmptyState action="Scrape now" onClick={scrapeNow}>
						No listings yet. Pull fresh jobs from the configured public sources.
					</EmptyState>
				) : null}
			</div>
		</div>
	);
}

function TrackerView({
	dialogOpen,
	setDialogOpen,
	draft,
	setDraft,
	jobsByStatus,
	addManualJob,
	updateStatus,
}: {
	dialogOpen: boolean;
	setDialogOpen: (open: boolean) => void;
	draft: DraftJob;
	setDraft: (draft: DraftJob) => void;
	jobsByStatus: Record<Status, TrackedJob[]>;
	addManualJob: () => void;
	updateStatus: (job: TrackedJob, status: Status) => void;
}) {
	return (
		<div className="flex flex-col gap-5">
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
							<Button onClick={addManualJob} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
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
							<KanbanCard key={job.id} job={job} updateStatus={updateStatus} />
						))}
					</section>
				))}
			</div>
		</div>
	);
}

function ProfileView({
	resumeText,
	setResumeText,
	saveProfile,
}: {
	resumeText: string;
	setResumeText: (value: string) => void;
	saveProfile: () => void;
}) {
	return (
		<Panel title="Resume Match Profile" description="Local keyword scoring only. No external AI or paid APIs.">
			<div className="flex flex-col gap-4">
				<DarkTextarea
					className="min-h-96 text-sm leading-6"
					placeholder="React, Node.js, SQLite, scraping, data visualization..."
					value={resumeText}
					onChange={(event) => setResumeText(event.target.value)}
				/>
				<div className="flex justify-end">
					<Button onClick={saveProfile} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
						<SaveIcon data-icon="inline-start" />
						Save Profile
					</Button>
				</div>
			</div>
		</Panel>
	);
}

function AnalyticsView({
	analytics,
	statusChart,
	applicationChart,
	chartOptions,
	doughnutOptions,
}: {
	analytics: Analytics | null;
	statusChart: ChartData<"doughnut">;
	applicationChart: ChartData<"line">;
	chartOptions: ChartOptions<"line">;
	doughnutOptions: ChartOptions<"doughnut">;
}) {
	return (
		<div className="flex flex-col gap-5">
			<div className="grid gap-4 md:grid-cols-3">
				<MetricCard title="Tracked Jobs" value={analytics?.totalTracked ?? 0} detail="Total saved roles" icon={TargetIcon} />
				<MetricCard title="Applications Sent" value={analytics?.totalApplied ?? 0} detail="Applied or beyond" icon={ActivityIcon} />
				<MetricCard
					title="Interview Conversion"
					value={`${analytics?.interviewConversionRate ?? 0}%`}
					detail="Interviewing plus offers"
					icon={CheckCircle2Icon}
				/>
			</div>
			<div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
				<Panel title="Applications Over Time" description="A soft indigo trendline over your application dates">
					<div className="h-80">
						<Line data={applicationChart} options={chartOptions} />
					</div>
				</Panel>
				<Panel title="Status Breakdown" description="Current distribution across pipeline lanes">
					<div className="h-80">
						<Doughnut data={statusChart} options={doughnutOptions} />
					</div>
				</Panel>
			</div>
		</div>
	);
}

function MetricCard({
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

function Panel({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
			<CardHeader>
				<CardTitle className="text-base font-semibold tracking-normal text-zinc-50">{title}</CardTitle>
				<CardDescription className="text-xs text-zinc-400">{description}</CardDescription>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function JobListItem({ job, onTrack }: { job: ScrapedJob; onTrack: () => void }) {
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

function JobCompact({ job }: { job: ScrapedJob }) {
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

function KanbanCard({ job, updateStatus }: { job: TrackedJob; updateStatus: (job: TrackedJob, status: Status) => void }) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/30">
			<div className="flex gap-3">
				<CompanyLogo name={job.company} small />
				<div className="min-w-0">
					<a href={job.url ?? undefined} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-medium text-zinc-100 hover:text-indigo-300">
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

function CompanyLogo({ name, small = false }: { name: string; small?: boolean }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join("");
	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-semibold text-indigo-300",
				small ? "size-9" : "size-12"
			)}
		>
			{initials || "?"}
		</div>
	);
}

function ScoreBadge({ score }: { score: number }) {
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

function ScrapeSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{[0, 1, 2, 3, 4].map((item) => (
				<div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
					<div className="flex gap-4">
						<div className="size-12 animate-pulse rounded-xl bg-zinc-800" />
						<div className="flex flex-1 flex-col gap-3">
							<div className="h-4 w-2/5 animate-pulse rounded bg-zinc-800" />
							<div className="h-3 w-1/4 animate-pulse rounded bg-zinc-800" />
							<div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function EmptyState({
	children,
	action,
	onClick,
}: {
	children: React.ReactNode;
	action: string;
	onClick: () => void;
}) {
	return (
		<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/45 p-8 text-center">
			<p className="text-sm text-zinc-400">{children}</p>
			<Button
				onClick={onClick}
				className="mt-4 rounded-xl bg-indigo-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
			>
				{action}
			</Button>
		</div>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<Label className="text-xs font-medium text-zinc-400">{label}</Label>
			{children}
		</div>
	);
}

function DarkInput(props: React.ComponentProps<typeof Input>) {
	return (
		<Input
			{...props}
			className={cn(
				"rounded-xl border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/30",
				props.className
			)}
		/>
	);
}

function DarkTextarea(props: React.ComponentProps<typeof Textarea>) {
	return (
		<Textarea
			{...props}
			className={cn(
				"rounded-xl border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/30",
				props.className
			)}
		/>
	);
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (status: Status) => void }) {
	return (
		<Select value={value} onValueChange={(nextValue) => onChange(nextValue as Status)}>
			<SelectTrigger className="w-full rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 transition-all duration-200 hover:bg-zinc-800">
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
				<SelectGroup>
					{STATUSES.map((status) => (
						<SelectItem key={status} value={status} className="focus:bg-zinc-900 focus:text-zinc-100">
							{status}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
