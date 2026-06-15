import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PROFILE_KEY = "default";

export const get = query({
	args: {},
	handler: async (ctx) => {
		const profile = await ctx.db.query("profiles").withIndex("by_key", (q) => q.eq("key", PROFILE_KEY)).unique();
		return {
			id: profile?._id ?? null,
			resumeText: profile?.resumeText ?? "",
		};
	},
});

export const save = mutation({
	args: {
		resumeText: v.string(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query("profiles").withIndex("by_key", (q) => q.eq("key", PROFILE_KEY)).unique();
		const updatedAt = Date.now();
		if (existing) {
			await ctx.db.patch(existing._id, { resumeText: args.resumeText, updatedAt });
			return { id: existing._id, resumeText: args.resumeText };
		}

		const id = await ctx.db.insert("profiles", {
			key: PROFILE_KEY,
			resumeText: args.resumeText,
			updatedAt,
		});
		return { id, resumeText: args.resumeText };
	},
});
