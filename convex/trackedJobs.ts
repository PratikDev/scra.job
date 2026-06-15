import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { statusValidator } from "./schema";
import { ACCEPTED_JOB_SOURCE_HOSTS, isAcceptedJobSourceUrl } from "./lib/acceptedJobSources";
import { scrapeJobFromUrl } from "./lib/scrapers";
import type { Doc, Id } from "./_generated/dataModel";
import type { Status, TrackedJob } from "./lib/types";

function serializeTrackedJob(job: Doc<"trackedJobs">): TrackedJob {
	return {
		id: job._id,
		title: job.title,
		company: job.company,
		salaryRange: job.salaryRange,
		url: job.url,
		notes: job.notes,
		dateApplied: job.dateApplied,
		status: job.status,
	};
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const rows = await ctx.db.query("trackedJobs").withIndex("by_updatedAt").order("desc").take(300);
		return rows.map(serializeTrackedJob);
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		company: v.string(),
		salaryRange: v.optional(v.union(v.string(), v.null())),
		url: v.string(),
		notes: v.optional(v.union(v.string(), v.null())),
		dateApplied: v.optional(v.union(v.string(), v.null())),
		status: v.optional(statusValidator),
		sourceJobId: v.optional(v.union(v.id("scrapedJobs"), v.null())),
	},
	handler: async (ctx, args) => {
		if (!isAcceptedJobSourceUrl(args.url)) {
			throw new Error(`Unsupported job source. Use a link from: ${ACCEPTED_JOB_SOURCE_HOSTS.join(", ")}.`);
		}

		const id = await ctx.db.insert("trackedJobs", {
			title: args.title,
			company: args.company,
			salaryRange: args.salaryRange ?? null,
			url: args.url,
			notes: args.notes ?? null,
			dateApplied: args.dateApplied ?? null,
			status: args.status ?? "To Apply",
			sourceJobId: args.sourceJobId ?? null,
			updatedAt: Date.now(),
		});
		const job = await ctx.db.get(id);
		if (!job) throw new Error("Tracked job could not be created");
		return serializeTrackedJob(job);
	},
});

export const createFromScraped = mutation({
	args: {
		id: v.id("scrapedJobs"),
	},
	handler: async (ctx, args) => {
		const scrapedJob = await ctx.db.get(args.id);
		if (!scrapedJob) throw new Error("Scraped job not found");

		const id = await ctx.db.insert("trackedJobs", {
			title: scrapedJob.title,
			company: scrapedJob.company,
			salaryRange: scrapedJob.salaryRange,
			url: scrapedJob.url,
			notes: `Saved from ${scrapedJob.source}`,
			dateApplied: null,
			status: "To Apply",
			sourceJobId: scrapedJob._id,
			updatedAt: Date.now(),
		});
		const job = await ctx.db.get(id);
		if (!job) throw new Error("Tracked job could not be created");
		return serializeTrackedJob(job);
	},
});

export const update = mutation({
	args: {
		id: v.id("trackedJobs"),
		title: v.optional(v.string()),
		company: v.optional(v.string()),
		salaryRange: v.optional(v.union(v.string(), v.null())),
		url: v.optional(v.union(v.string(), v.null())),
		notes: v.optional(v.union(v.string(), v.null())),
		dateApplied: v.optional(v.union(v.string(), v.null())),
		status: v.optional(statusValidator),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
		const job = await ctx.db.get(id);
		if (!job) throw new Error("Tracked job not found");
		return serializeTrackedJob(job);
	},
});

export const remove = mutation({
	args: {
		id: v.id("trackedJobs"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { deleted: 1 };
	},
});

export const createFromExtracted = internalMutation({
	args: {
		title: v.string(),
		company: v.string(),
		salaryRange: v.union(v.string(), v.null()),
		url: v.string(),
		notes: v.union(v.string(), v.null()),
		dateApplied: v.union(v.string(), v.null()),
		status: statusValidator,
		sourceJobId: v.union(v.id("scrapedJobs"), v.null()),
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert("trackedJobs", {
			title: args.title,
			company: args.company,
			salaryRange: args.salaryRange,
			url: args.url,
			notes: args.notes,
			dateApplied: args.dateApplied,
			status: args.status,
			sourceJobId: args.sourceJobId,
			updatedAt: Date.now(),
		});
		const job = await ctx.db.get(id);
		if (!job) throw new Error("Tracked job could not be created");
		return serializeTrackedJob(job);
	},
});

export const importTrackedJobs = internalMutation({
	args: {
		jobs: v.array(
			v.object({
				title: v.string(),
				company: v.string(),
				salaryRange: v.union(v.string(), v.null()),
				url: v.union(v.string(), v.null()),
				notes: v.union(v.string(), v.null()),
				dateApplied: v.union(v.string(), v.null()),
				status: statusValidator,
				sourceJobId: v.union(v.id("scrapedJobs"), v.null()),
			})
		),
	},
	handler: async (ctx, args) => {
		let inserted = 0;
		for (const job of args.jobs) {
			await ctx.db.insert("trackedJobs", { ...job, updatedAt: Date.now() });
			inserted += 1;
		}
		return { inserted };
	},
});

export const createFromUrl = action({
	args: {
		url: v.string(),
		notes: v.optional(v.string()),
		dateApplied: v.optional(v.string()),
		status: v.optional(statusValidator),
	},
	handler: async (ctx, args): Promise<TrackedJob> => {
		if (!isAcceptedJobSourceUrl(args.url)) {
			throw new Error(`Unsupported job source. Use a link from: ${ACCEPTED_JOB_SOURCE_HOSTS.join(", ")}.`);
		}

		const existingScrapedJob: Doc<"scrapedJobs"> | null = await ctx.runQuery(api.jobs.getByUrl, { url: args.url });
		let extractedJob = null;
		try {
			extractedJob = await scrapeJobFromUrl(args.url);
		} catch (error) {
			if (!existingScrapedJob) throw error;
			extractedJob = {
				source: existingScrapedJob.source,
				sourceId: existingScrapedJob.sourceId,
				title: existingScrapedJob.title,
				company: existingScrapedJob.company,
				location: existingScrapedJob.location,
				url: existingScrapedJob.url,
				description: existingScrapedJob.description,
				datePosted: existingScrapedJob.datePosted,
				salaryRange: existingScrapedJob.salaryRange,
			};
		}

		if (!extractedJob?.title || !extractedJob?.company) {
			throw new Error("Could not extract job details from this link.");
		}

		const trackedJob: TrackedJob = await ctx.runMutation(internal.trackedJobs.createFromExtracted, {
			title: extractedJob.title,
			company: extractedJob.company,
			salaryRange: extractedJob.salaryRange,
			url: args.url,
			notes: args.notes || `Imported from ${extractedJob.source}`,
			dateApplied: args.dateApplied ?? null,
			status: args.status ?? "To Apply",
			sourceJobId: existingScrapedJob?._id ?? null,
		});
		return trackedJob;
	},
});

export type TrackedJobId = Id<"trackedJobs">;
export type { Status };
