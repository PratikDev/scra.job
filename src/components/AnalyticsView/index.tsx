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
import { ActivityIcon, CheckCircle2Icon, TargetIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import { STATUSES, type Analytics } from "@/lib/types";
import { MetricCard } from "./MetricCard";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

export function AnalyticsView() {
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadAnalytics() {
			try {
				setAnalytics(await api<Analytics>("/api/analytics"));
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Failed to load analytics");
			}
		}

		void loadAnalytics();
	}, []);

	const statusChart = useMemo(
		() => ({
			labels: [...STATUSES],
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
		<div className="flex flex-col gap-5">
			{error ? (
				<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
					{error}
				</div>
			) : null}
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
