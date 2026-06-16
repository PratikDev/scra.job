import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const TRACKED_JOB_STATUSES = ["To Apply", "Qualifying", "Applied", "Interviewing", "Offer", "Rejected"] as const;
const [toApplyStatus, qualifyingStatus, appliedStatus, interviewingStatus, offerStatus, rejectedStatus] = TRACKED_JOB_STATUSES;
export const DEFAULT_TRACKED_JOB_STATUS = toApplyStatus;
export const APPLIED_TRACKED_JOB_STATUSES = [appliedStatus, interviewingStatus, offerStatus, rejectedStatus] as const;
export const INTERVIEW_TRACKED_JOB_STATUSES = [interviewingStatus, offerStatus] as const;

export const statusValidator = v.union(
	v.literal(toApplyStatus),
	v.literal(qualifyingStatus),
	v.literal(appliedStatus),
	v.literal(interviewingStatus),
	v.literal(offerStatus),
	v.literal(rejectedStatus)
);

export default defineSchema({
	scrapedJobs: defineTable({
		source: v.string(),
		sourceId: v.string(),
		title: v.string(),
		company: v.string(),
		location: v.string(),
		url: v.string(),
		description: v.string(),
		datePosted: v.union(v.number(), v.null()),
		salaryRange: v.union(v.string(), v.null()),
	})
		.index("by_source_and_sourceId", ["source", "sourceId"])
		.index("by_datePosted", ["datePosted"])
		.index("by_url", ["url"]),

	trackedJobs: defineTable({
		title: v.string(),
		company: v.string(),
		salaryRange: v.union(v.string(), v.null()),
		url: v.union(v.string(), v.null()),
		notes: v.union(v.string(), v.null()),
		dateApplied: v.union(v.string(), v.null()),
		status: statusValidator,
		sourceJobId: v.union(v.id("scrapedJobs"), v.null()),
		updatedAt: v.number(),
	})
		.index("by_status", ["status"])
		.index("by_updatedAt", ["updatedAt"]),

	profiles: defineTable({
		key: v.string(),
		resumeText: v.string(),
		updatedAt: v.number(),
	}).index("by_key", ["key"]),
});
