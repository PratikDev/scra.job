import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { calculateMatchScore } from "./lib/matchScore";
import { scrapeAllSources } from "./lib/scrapers";
import type { ScrapedJob, ScrapedJobPayload } from "./lib/types";

const scrapedJobPayloadValidator = v.object({
	source: v.string(),
	sourceId: v.string(),
	title: v.string(),
	company: v.string(),
	location: v.string(),
	url: v.string(),
	description: v.string(),
	datePosted: v.union(v.number(), v.null()),
	salaryRange: v.union(v.string(), v.null()),
});

const importedScrapedJobPayloadValidator = v.object({
	source: v.string(),
	sourceId: v.string(),
	title: v.string(),
	company: v.string(),
	location: v.string(),
	url: v.string(),
	description: v.string(),
	datePosted: v.union(v.number(), v.null()),
	salaryRange: v.union(v.string(), v.null()),
	legacyId: v.optional(v.number()),
});

function serializeScrapedJob(job: Doc<"scrapedJobs">, resumeText: string): ScrapedJob {
	return {
		id: job._id,
		source: job.source,
		title: job.title,
		company: job.company,
		location: job.location,
		url: job.url,
		description: job.description,
		datePosted: job.datePosted,
		salaryRange: job.salaryRange,
		matchScore: calculateMatchScore(resumeText, `${job.title} ${job.company} ${job.description}`),
	};
}

export const listScrapedJobs = query({
	args: {},
	handler: async (ctx) => {
		const profile = await ctx.db.query("profiles").withIndex("by_key", (q) => q.eq("key", "default")).unique();
		const rows = await ctx.db.query("scrapedJobs").withIndex("by_datePosted").order("desc").take(300);

		if (rows.length === 0) return [];

		return rows
			.map((job) => serializeScrapedJob(job, profile?.resumeText ?? ""))
			.sort((jobA, jobB) => {
				if (jobB.matchScore !== jobA.matchScore) return jobB.matchScore - jobA.matchScore;
				return (jobB.datePosted ?? 0) - (jobA.datePosted ?? 0);
			});
	},
});

export const getById = query({
	args: {
		id: v.id("scrapedJobs"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByUrl = query({
	args: {
		url: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.query("scrapedJobs").withIndex("by_url", (q) => q.eq("url", args.url)).first();
	},
});

export const upsertScrapedJobs = internalMutation({
	args: {
		jobs: v.array(scrapedJobPayloadValidator),
	},
	handler: async (ctx, args) => {
		let inserted = 0;
		let updated = 0;

		for (const job of args.jobs) {
			const existing = await ctx.db
				.query("scrapedJobs")
				.withIndex("by_source_and_sourceId", (q) => q.eq("source", job.source).eq("sourceId", job.sourceId))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, job);
				updated += 1;
			} else {
				await ctx.db.insert("scrapedJobs", job);
				inserted += 1;
			}
		}

		return { inserted, updated };
	},
});

export const importScrapedJobs = internalMutation({
	args: {
		jobs: v.array(importedScrapedJobPayloadValidator),
	},
	handler: async (ctx, args) => {
		const idMap: Record<string, Id<"scrapedJobs">> = {};
		let inserted = 0;
		let updated = 0;

		for (const job of args.jobs) {
			const { legacyId, ...payload } = job;
			const existing = await ctx.db
				.query("scrapedJobs")
				.withIndex("by_source_and_sourceId", (q) => q.eq("source", payload.source).eq("sourceId", payload.sourceId))
				.unique();
			const id = existing?._id ?? (await ctx.db.insert("scrapedJobs", payload));
			if (existing) {
				await ctx.db.patch(existing._id, payload);
				updated += 1;
			} else {
				inserted += 1;
			}
			if (legacyId !== undefined) idMap[String(legacyId)] = id;
		}

		return { inserted, updated, idMap };
	},
});

export const scrapeNow = action({
	args: {},
	handler: async (ctx): Promise<{ inserted: number; updated: number; errors: { source: string; message: string }[] }> => {
		const { jobs, errors } = await scrapeAllSources();
		const result: { inserted: number; updated: number } = await ctx.runMutation(internal.jobs.upsertScrapedJobs, { jobs });
		return { ...result, errors };
	},
});

export type { ScrapedJobPayload };
