export const STATUSES = ["To Apply", "Applied", "Interviewing", "Offer", "Rejected"] as const;

export type Status = (typeof STATUSES)[number];
export type ActiveView = "dashboard" | "scraper" | "tracker" | "profile" | "analytics";

export type ScrapedJob = {
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

export type TrackedJob = {
	id: number;
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

export type JobFilters = {
	title: string;
	company: string;
	from: string;
	to: string;
};
