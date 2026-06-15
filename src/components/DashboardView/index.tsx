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
import type { ChartOptions, ScriptableContext } from "chart.js";
import { ActivityIcon, CheckCircle2Icon, SearchIcon, TargetIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { Analytics, ScrapedJob, TrackedJob } from "@/lib/types";
import { JobCompact } from "./JobCompact";
import { MetricCard } from "./MetricCard";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

export function DashboardView() {
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>([]);
	const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadDashboard() {
			try {
				const [jobs, tracked, stats] = await Promise.all([
					api<ScrapedJob[]>("/api/jobs"),
					api<TrackedJob[]>("/api/tracked-jobs"),
					api<Analytics>("/api/analytics"),
				]);
				setScrapedJobs(jobs);
				setTrackedJobs(tracked);
				setAnalytics(stats);
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Failed to load dashboard");
			} finally {
				setLoading(false);
			}
		}

		void loadDashboard();
	}, []);

	const pendingJobs = trackedJobs.filter((job) => job.status === "To Apply").length;
	const topMatches = useMemo(
		() => [...scrapedJobs].sort((jobA, jobB) => jobB.matchScore - jobA.matchScore).slice(0, 4),
		[scrapedJobs]
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

	return (
		<div className="flex flex-col gap-5">
			{error ? (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			) : null}
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard title="Scraped Jobs" value={loading ? "..." : scrapedJobs.length} detail="Public listings indexed" icon={SearchIcon} />
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
							<EmptyState action="Open scraper" to="/scraper">
								Run a scrape to surface match-ranked jobs.
							</EmptyState>
						) : null}
					</div>
				</Panel>
			</div>
		</div>
	);
}
