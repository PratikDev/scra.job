import { existsSync } from "node:fs";
import { Database as SqliteDatabase } from "bun:sqlite";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Status } from "../src/lib/types";

type SqliteScrapedJob = {
	id: number;
	source: string;
	sourceId: string;
	title: string;
	company: string;
	location: string;
	url: string;
	description: string;
	datePosted: string | null;
	salaryRange: string | null;
};

type SqliteTrackedJob = {
	title: string;
	company: string;
	salaryRange: string | null;
	url: string | null;
	notes: string | null;
	dateApplied: string | null;
	status: Status;
	sourceJobId: number | null;
};

type SqliteProfile = {
	id: number;
	resumeText: string;
};

const dryRun = process.argv.includes("--dry-run");
const databasePath = process.env.SQLITE_DB_PATH ?? "data/scrajob.sqlite";
const convexUrl = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;

if (!existsSync(databasePath)) {
	throw new Error(`SQLite database not found at ${databasePath}`);
}
if (!dryRun && !convexUrl) {
	throw new Error("CONVEX_URL or VITE_CONVEX_URL is required unless --dry-run is used");
}

function timestamp(value: string | null) {
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}

function dateOnly(value: string | null) {
	if (!value) return null;
	return value.slice(0, 10);
}

const sqlite = new SqliteDatabase(databasePath, { readonly: true });
const scrapedJobs = sqlite.query("select * from ScrapedJobs").all() as SqliteScrapedJob[];
const trackedJobs = sqlite.query("select * from TrackedJobs").all() as SqliteTrackedJob[];
const profiles = sqlite.query("select * from Profiles").all() as SqliteProfile[];

console.log(`Found ${scrapedJobs.length} scraped jobs, ${trackedJobs.length} tracked jobs, ${profiles.length} profiles.`);

if (dryRun) {
	sqlite.close();
	process.exit(0);
}

if (!convexUrl) throw new Error("CONVEX_URL or VITE_CONVEX_URL is required");

const client = new ConvexHttpClient(convexUrl);
const scrapedResult = await client.mutation(api.importData.importScrapedJobs, {
	jobs: scrapedJobs.map((job) => ({
		legacyId: job.id,
		source: job.source,
		sourceId: job.sourceId,
		title: job.title,
		company: job.company,
		location: job.location,
		url: job.url,
		description: job.description,
		datePosted: timestamp(job.datePosted),
		salaryRange: job.salaryRange,
	})),
});

const idMap = scrapedResult.idMap as Record<string, Id<"scrapedJobs">>;
const trackedResult = await client.mutation(api.importData.importTrackedJobs, {
	jobs: trackedJobs.map((job) => ({
		title: job.title,
		company: job.company,
		salaryRange: job.salaryRange,
		url: job.url,
		notes: job.notes,
		dateApplied: dateOnly(job.dateApplied),
		status: job.status,
		sourceJobId: job.sourceJobId === null ? null : idMap[String(job.sourceJobId)] ?? null,
	})),
});

const profile = profiles.find((row) => row.id === 1) ?? profiles[0];
if (profile) {
	await client.mutation(api.importData.importProfile, { resumeText: profile.resumeText });
}

sqlite.close();
console.log(
	`Import complete: ${scrapedResult.inserted} scraped inserted, ${scrapedResult.updated} scraped updated, ${trackedResult.inserted} tracked inserted.`
);
