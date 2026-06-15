import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { statusValidator } from "./schema";
import type { Id } from "./_generated/dataModel";

const scrapedImportValidator = v.object({
	legacyId: v.number(),
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

export const importScrapedJobs = mutation({
	args: {
		jobs: v.array(scrapedImportValidator),
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
			if (existing) {
				await ctx.db.patch(existing._id, payload);
				idMap[String(legacyId)] = existing._id;
				updated += 1;
			} else {
				const id = await ctx.db.insert("scrapedJobs", payload);
				idMap[String(legacyId)] = id;
				inserted += 1;
			}
		}

		return { inserted, updated, idMap };
	},
});

export const importTrackedJobs = mutation({
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

export const importProfile = mutation({
	args: {
		resumeText: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query("profiles").withIndex("by_key", (q) => q.eq("key", "default")).unique();
		const updatedAt = Date.now();
		if (existing) {
			await ctx.db.patch(existing._id, { resumeText: args.resumeText, updatedAt });
			return { id: existing._id, resumeText: args.resumeText };
		}
		const id = await ctx.db.insert("profiles", { key: "default", resumeText: args.resumeText, updatedAt });
		return { id, resumeText: args.resumeText };
	},
});
