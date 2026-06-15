import axios from "axios";
import * as cheerio from "cheerio";
import { onlyRemoteJobs } from "./remoteFilter.js";

const http = axios.create({
	timeout: 15000,
	headers: {
		"User-Agent": "Scra.job local job tracker (contact: local)",
		Accept: "application/json,text/html,application/rss+xml",
	},
});

function cleanText(value = "") {
	return String(value).replace(/\s+/g, " ").trim();
}

function stripHtml(value = "") {
	return cleanText(cheerio.load(String(value)).text());
}

function parseDate(value) {
	const timestamp = Date.parse(value ?? "");
	return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function parseRemoteOkDate(job) {
	if (job.epoch) {
		return new Date(Number(job.epoch) * 1000);
	}
	return parseDate(job.date);
}

function parseTitleCompany(rawTitle) {
	const title = cleanText(rawTitle);
	const atMatch = title.match(/^(.*?)\s+(?:at|@)\s+(.+)$/i);
	if (atMatch) {
		return { title: cleanText(atMatch[1]), company: cleanText(atMatch[2]) };
	}

	const dashMatch = title.match(/^(.*?)\s+-\s+(.+)$/);
	if (dashMatch) {
		return { title: cleanText(dashMatch[2]), company: cleanText(dashMatch[1]) };
	}

	const colonMatch = title.match(/^([^:]{2,80}):\s+(.+)$/);
	if (colonMatch) {
		return { title: cleanText(colonMatch[2]), company: cleanText(colonMatch[1]) };
	}

	return { title, company: "Unknown" };
}

export async function scrapeWeWorkRemotely() {
	const { data } = await http.get("https://weworkremotely.com/remote-jobs.rss", {
		responseType: "text",
	});
	const $ = cheerio.load(data, { xmlMode: true });

	const jobs = $("item")
		.toArray()
		.slice(0, 40)
		.map((item) => {
			const node = $(item);
			const rawTitle = cleanText(node.find("title").first().text());
			const parsed = parseTitleCompany(rawTitle);
			const url = cleanText(node.find("link").first().text());
			const description = stripHtml(node.find("description").first().text());

			return {
				source: "We Work Remotely",
				sourceId: cleanText(node.find("guid").first().text()) || url,
				title: parsed.title,
				company: parsed.company,
				location: "Remote",
				url,
				description,
				datePosted: parseDate(node.find("pubDate").first().text()),
				salaryRange: null,
			};
		})
		.filter((job) => job.title && job.url);

	return onlyRemoteJobs(jobs);
}

export async function scrapeRemoteOk() {
	const { data } = await http.get("https://remoteok.com/api");
	const rows = Array.isArray(data) ? data.slice(1, 51) : [];

	const jobs = rows
		.map((job) => ({
			source: "RemoteOK",
			sourceId: String(job.id ?? job.url ?? job.slug),
			title: cleanText(job.position || job.title || "Untitled role"),
			company: cleanText(job.company || "Unknown"),
			location: cleanText(job.location || "Remote"),
			url: job.url || (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : "https://remoteok.com"),
			description: stripHtml([job.description, ...(job.tags ?? [])].join(" ")),
			datePosted: parseRemoteOkDate(job),
			salaryRange:
				job.salary_min || job.salary_max
					? `$${job.salary_min || 0} - $${job.salary_max || "open"}`
					: null,
		}))
		.filter((job) => job.sourceId && job.title && job.url);

	return onlyRemoteJobs(jobs);
}

export async function scrapeHackerNewsJobs() {
	const { data: ids } = await http.get("https://hacker-news.firebaseio.com/v0/jobstories.json");
	const topIds = Array.isArray(ids) ? ids.slice(0, 30) : [];
	const responses = await Promise.allSettled(
		topIds.map((id) => http.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
	);

	const jobs = responses
		.filter((result) => result.status === "fulfilled" && result.value.data)
		.map((result) => {
			const item = result.value.data;
			const parsed = parseTitleCompany(item.title || "Hacker News job");
			return {
				source: "Hacker News Jobs",
				sourceId: String(item.id),
				title: parsed.title,
				company: parsed.company,
				location: "Remote / See listing",
				url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
				description: stripHtml(item.text || item.title || ""),
				datePosted: item.time ? new Date(item.time * 1000) : null,
				salaryRange: null,
			};
		})
		.filter((job) => job.title && job.url);

	return onlyRemoteJobs(jobs);
}

export async function scrapeAllSources() {
	const sources = [
		["We Work Remotely", scrapeWeWorkRemotely],
		["RemoteOK", scrapeRemoteOk],
		["Hacker News Jobs", scrapeHackerNewsJobs],
	];

	const results = await Promise.allSettled(sources.map(([, scrape]) => scrape()));
	const jobs = [];
	const errors = [];

	results.forEach((result, index) => {
		const source = sources[index][0];
		if (result.status === "fulfilled") {
			jobs.push(...result.value);
		} else {
			errors.push({
				source,
				message: result.reason?.message || "Scrape failed",
			});
		}
	});

	return { jobs, errors };
}
