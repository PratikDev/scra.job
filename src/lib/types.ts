import type { Id } from "../../convex/_generated/dataModel";
import type { TRACKED_JOB_STATUSES } from "../../convex/schema";

export type Status = (typeof TRACKED_JOB_STATUSES)[number];
export type ActiveView = "dashboard" | "scraper" | "tracker" | "profile" | "analytics";

export type ScrapedJob = {
	id: Id<"scrapedJobs">;
	source: string;
	title: string;
	company: string;
	location: string;
	url: string;
	description: string;
	datePosted: number | null;
	salaryRange: string | null;
	matchScore: number;
};

export type TrackedJob = {
	id: Id<"trackedJobs">;
	title: string;
	company: string;
	salaryRange: string | null;
	url: string | null;
	notes: string | null;
	dateApplied: string | null;
	status: Status;
};

export type Analytics = {
	totalTracked: number;
	totalApplied: number;
	interviewConversionRate: number;
	statusCounts: Record<Status, number>;
	applicationsOverTime: { date: string; count: number }[];
};

export type DraftJob = {
	title: string;
	company: string;
	salaryRange: string;
	url: string;
	notes: string;
	dateApplied: string;
	status: Status;
};
