import fs from "node:fs";
import cors from "cors";
import express from "express";
import { Op } from "sequelize";
import { Profile, ScrapedJob, TrackedJob, initDatabase } from "./database.js";
import { calculateMatchScore } from "./matchScore.js";
import { scrapeAllSources } from "./scrapers.js";

fs.mkdirSync("data", { recursive: true });

const app = express();
const port = Number(process.env.API_PORT || 4000);
const TRACKER_STATUSES = ["To Apply", "Applied", "Interviewing", "Offer", "Rejected"];

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function serializeJob(job, profileText = "") {
	const plain = job.toJSON ? job.toJSON() : job;
	return {
		...plain,
		matchScore: calculateMatchScore(profileText, `${plain.title} ${plain.company} ${plain.description}`),
	};
}

app.get("/api/health", (_request, response) => {
	response.json({ ok: true });
});

app.get("/api/jobs", async (request, response, next) => {
	try {
		const { title, company, from, to } = request.query;
		const where = {};

		if (title) {
			where.title = { [Op.like]: `%${title}%` };
		}
		if (company) {
			where.company = { [Op.like]: `%${company}%` };
		}
		if (from || to) {
			where.datePosted = {};
			if (from) where.datePosted[Op.gte] = new Date(String(from));
			if (to) where.datePosted[Op.lte] = new Date(String(to));
		}

		const [profile, jobs] = await Promise.all([
			Profile.findByPk(1),
			ScrapedJob.findAll({ where, order: [["datePosted", "DESC"], ["createdAt", "DESC"]] }),
		]);

		response.json(jobs.map((job) => serializeJob(job, profile?.resumeText ?? "")));
	} catch (error) {
		next(error);
	}
});

app.post("/api/scrape", async (_request, response, next) => {
	try {
		const { jobs, errors } = await scrapeAllSources();
		let inserted = 0;
		let updated = 0;

		for (const job of jobs) {
			const [record, created] = await ScrapedJob.findOrCreate({
				where: { source: job.source, sourceId: job.sourceId },
				defaults: job,
			});
			if (created) {
				inserted += 1;
			} else {
				await record.update(job);
				updated += 1;
			}
		}

		response.json({ inserted, updated, errors });
	} catch (error) {
		next(error);
	}
});

app.get("/api/tracked-jobs", async (_request, response, next) => {
	try {
		const jobs = await TrackedJob.findAll({ order: [["updatedAt", "DESC"]] });
		response.json(jobs);
	} catch (error) {
		next(error);
	}
});

app.post("/api/tracked-jobs", async (request, response, next) => {
	try {
		const payload = request.body ?? {};
		const job = await TrackedJob.create({
			title: payload.title,
			company: payload.company,
			salaryRange: payload.salaryRange || null,
			url: payload.url || null,
			notes: payload.notes || null,
			dateApplied: payload.dateApplied || null,
			status: TRACKER_STATUSES.includes(payload.status) ? payload.status : "To Apply",
			sourceJobId: payload.sourceJobId || null,
		});
		response.status(201).json(job);
	} catch (error) {
		next(error);
	}
});

app.post("/api/tracked-jobs/from-scraped/:id", async (request, response, next) => {
	try {
		const scrapedJob = await ScrapedJob.findByPk(request.params.id);
		if (!scrapedJob) {
			response.status(404).json({ error: "Scraped job not found" });
			return;
		}
		const job = await TrackedJob.create({
			title: scrapedJob.title,
			company: scrapedJob.company,
			salaryRange: scrapedJob.salaryRange,
			url: scrapedJob.url,
			notes: `Saved from ${scrapedJob.source}`,
			status: "To Apply",
			sourceJobId: scrapedJob.id,
		});
		response.status(201).json(job);
	} catch (error) {
		next(error);
	}
});

app.patch("/api/tracked-jobs/:id", async (request, response, next) => {
	try {
		const job = await TrackedJob.findByPk(request.params.id);
		if (!job) {
			response.status(404).json({ error: "Tracked job not found" });
			return;
		}

		const allowed = ["title", "company", "salaryRange", "url", "notes", "dateApplied", "status"];
		const updates = {};
		for (const key of allowed) {
			if (Object.hasOwn(request.body, key)) {
				updates[key] = request.body[key] || null;
			}
		}
		if (updates.status && !TRACKER_STATUSES.includes(updates.status)) {
			response.status(400).json({ error: "Invalid status" });
			return;
		}

		await job.update(updates);
		response.json(job);
	} catch (error) {
		next(error);
	}
});

app.delete("/api/tracked-jobs/:id", async (request, response, next) => {
	try {
		const deleted = await TrackedJob.destroy({ where: { id: request.params.id } });
		response.json({ deleted });
	} catch (error) {
		next(error);
	}
});

app.get("/api/profile", async (_request, response, next) => {
	try {
		const [profile] = await Profile.findOrCreate({ where: { id: 1 }, defaults: { resumeText: "" } });
		response.json(profile);
	} catch (error) {
		next(error);
	}
});

app.put("/api/profile", async (request, response, next) => {
	try {
		const [profile] = await Profile.findOrCreate({ where: { id: 1 }, defaults: { resumeText: "" } });
		await profile.update({ resumeText: request.body?.resumeText || "" });
		response.json(profile);
	} catch (error) {
		next(error);
	}
});

app.get("/api/analytics", async (_request, response, next) => {
	try {
		const jobs = await TrackedJob.findAll();
		const statusCounts = Object.fromEntries(TRACKER_STATUSES.map((status) => [status, 0]));
		const applicationsByDate = {};
		let appliedOrBeyond = 0;
		let interviewingOrBeyond = 0;

		for (const job of jobs) {
			const plain = job.toJSON();
			statusCounts[plain.status] = (statusCounts[plain.status] || 0) + 1;
			if (plain.status !== "To Apply") {
				appliedOrBeyond += 1;
			}
			if (["Interviewing", "Offer"].includes(plain.status)) {
				interviewingOrBeyond += 1;
			}
			if (plain.dateApplied) {
				applicationsByDate[plain.dateApplied] = (applicationsByDate[plain.dateApplied] || 0) + 1;
			}
		}

		response.json({
			totalTracked: jobs.length,
			totalApplied: appliedOrBeyond,
			interviewConversionRate:
				appliedOrBeyond === 0 ? 0 : Math.round((interviewingOrBeyond / appliedOrBeyond) * 100),
			statusCounts,
			applicationsOverTime: Object.entries(applicationsByDate)
				.sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
				.map(([date, count]) => ({ date, count })),
		});
	} catch (error) {
		next(error);
	}
});

app.use((error, _request, response, _next) => {
	console.error(error);
	response.status(500).json({ error: error.message || "Unexpected server error" });
});

await initDatabase();
app.listen(port, () => {
	console.log(`Scra.job API listening on http://localhost:${port}`);
});
