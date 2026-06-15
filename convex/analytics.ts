import { query } from "./_generated/server";
import { STATUSES, type Analytics, type Status } from "./lib/types";

export const get = query({
	args: {},
	handler: async (ctx): Promise<Analytics> => {
		const statusCounts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>;
		const applicationsByDate: Record<string, number> = {};
		let totalTracked = 0;
		let appliedOrBeyond = 0;
		let interviewingOrBeyond = 0;

		for await (const job of ctx.db.query("trackedJobs")) {
			totalTracked += 1;
			statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
			if (job.status !== "To Apply") appliedOrBeyond += 1;
			if (["Interviewing", "Offer"].includes(job.status)) interviewingOrBeyond += 1;
			if (job.dateApplied) applicationsByDate[job.dateApplied] = (applicationsByDate[job.dateApplied] || 0) + 1;
		}

		return {
			totalTracked,
			totalApplied: appliedOrBeyond,
			interviewConversionRate: appliedOrBeyond === 0 ? 0 : Math.round((interviewingOrBeyond / appliedOrBeyond) * 100),
			statusCounts,
			applicationsOverTime: Object.entries(applicationsByDate)
				.sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
				.map(([date, count]) => ({ date, count })),
		};
	},
});
