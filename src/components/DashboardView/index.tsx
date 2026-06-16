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
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useQuery } from "convex/react";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/Panel";
import { api as convexApi } from "../../../convex/_generated/api";
import { DEFAULT_TRACKED_JOB_STATUS } from "../../../convex/schema";
import type { Analytics, ScrapedJob, TrackedJob } from "@/lib/types";
import { JobCompact } from "./JobCompact";
import { MetricCard } from "./MetricCard";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

export function DashboardView() {
	const loadedJobs = useQuery(convexApi.jobs.listScrapedJobs, {});
	const loadedTrackedJobs = useQuery(convexApi.trackedJobs.list, {});
	const analytics = useQuery(convexApi.analytics.get, {}) as Analytics | undefined;
	const scrapedJobs = (loadedJobs ?? []) as ScrapedJob[];
	const trackedJobs = (loadedTrackedJobs ?? []) as TrackedJob[];
	const loading = loadedJobs === undefined || loadedTrackedJobs === undefined || analytics === undefined;

	const pendingJobs = trackedJobs.filter((job) => job.status === DEFAULT_TRACKED_JOB_STATUS).length;
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
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard title="Scraped Jobs" value={loading ? "..." : scrapedJobs.length} detail="Public listings indexed" icon={SearchIcon} />
				<MetricCard title="Tracked" value={analytics?.totalTracked ?? 0} detail="Applications in pipeline" icon={TargetIcon} />
				<MetricCard title={DEFAULT_TRACKED_JOB_STATUS} value={pendingJobs} detail="Open action queue" icon={ActivityIcon} />
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
