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

function parseRelativeDate(value = "") {
	const normalized = cleanText(value).toLowerCase();
	const amount = Number(normalized.match(/\d+/)?.[0] ?? (normalized.includes("a ") ? 1 : 0));
	if (!amount) return null;

	const date = new Date();
	if (normalized.includes("hour")) date.setHours(date.getHours() - amount);
	else if (normalized.includes("day")) date.setDate(date.getDate() - amount);
	else if (normalized.includes("month")) date.setMonth(date.getMonth() - amount);
	else if (normalized.includes("year")) date.setFullYear(date.getFullYear() - amount);
	else return null;

	return date;
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

function normalizeUrl(value = "") {
	try {
		const url = new URL(value);
		url.hash = "";
		url.searchParams.sort();
		return url.toString().replace(/\/$/, "");
	} catch {
		return cleanText(value).replace(/\/$/, "");
	}
}

function extractSalaryRange(value = "") {
	return (
		cleanText(value).match(
			/(?:[$£€₹]\s?\d[\d,.]*(?:\s?[kKmM])?(?:\s?(?:-|–|to)\s?(?:[$£€₹]\s?)?\d[\d,.]*(?:\s?[kKmM])?)?)/u
		)?.[0] ?? null
	);
}

function inferCompanyFromHostname(value = "") {
	try {
		const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
		const [name] = hostname.split(".");
		return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Unknown";
	} catch {
		return "Unknown";
	}
}

function scoreImportedJobCandidate(job) {
	let score = 0;
	if (job.company && job.company !== "Unknown") score += 20;
	if (job.salaryRange) score += 5;
	if (job.description && job.description.length > 120) score += 5;
	if (job.source?.includes("Y Combinator")) score += 3;
	return score;
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

export async function scrapeYCombinatorSoftwareEngineerJobs() {
	const { data } = await http.get("https://www.ycombinator.com/jobs/role/software-engineer", {
		responseType: "text",
		headers: { Accept: "text/html,application/xhtml+xml" },
	});
	const $ = cheerio.load(data);

	const jobs = $("li")
		.toArray()
		.map((item) => {
			const node = $(item);
			const jobLink = node.find('a[href*="/companies/"][href*="/jobs/"]').first();
			if (!jobLink.length) return null;

			const metadata = jobLink
				.next("div")
				.children("div")
				.toArray()
				.map((element) => cleanText($(element).text()))
				.filter((entry) => entry && entry !== "•");
			const salaryRange = metadata.find((entry) => /[$£€₹]\s?\d|K|M/.test(entry)) ?? null;
			const location = metadata.at(-1) ?? "";
			const companyLink = node.find('a[href^="/companies/"]:not([href*="/jobs/"]) span.font-bold').first();
			const company = cleanText(companyLink.text()) || parseTitleCompany(jobLink.text()).company;
			const relativeDate = node.text().match(/\(([^()]*ago)\)/i)?.[1];
			const url = new URL(jobLink.attr("href"), "https://www.ycombinator.com").toString();

			return {
				source: "Y Combinator Software Engineer Jobs",
				sourceId: url,
				title: cleanText(jobLink.text()),
				company,
				location,
				url,
				description: cleanText(node.text()),
				datePosted: parseRelativeDate(relativeDate),
				salaryRange,
			};
		})
		.filter(Boolean)
		.filter((job) => job.title && job.url);

	return onlyRemoteJobs(jobs);
}

export async function scrapeHackerNewsJobsPage() {
	const { data } = await http.get("https://news.ycombinator.com/jobs", {
		responseType: "text",
	});
	const $ = cheerio.load(data);

	const jobs = $(".athing")
		.toArray()
		.map((row) => {
			const node = $(row);
			const id = node.attr("id");
			const titleLink = node.find(".titleline > a").first();
			if (!id || !titleLink.length) return null;

			const title = cleanText(titleLink.text());
			const url = new URL(titleLink.attr("href"), "https://news.ycombinator.com").toString();
			const subtext = node.next("tr").find(".age").first().text();
			const parsed = parseTitleCompany(title);

			return {
				source: "Hacker News Jobs Page",
				sourceId: id,
				title: parsed.title,
				company: parsed.company,
				location: title,
				url,
				description: title,
				datePosted: parseRelativeDate(subtext),
				salaryRange: null,
			};
		})
		.filter(Boolean)
		.filter((job) => job.title && job.url);

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
		["Y Combinator Software Engineer Jobs", scrapeYCombinatorSoftwareEngineerJobs],
		["Hacker News Jobs Page", scrapeHackerNewsJobsPage],
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

export async function scrapeJobFromUrl(url) {
	const normalizedUrl = normalizeUrl(url);
	const { jobs } = await scrapeAllSources();
	const matchedJob = jobs
		.filter((job) => normalizeUrl(job.url) === normalizedUrl)
		.sort((jobA, jobB) => scoreImportedJobCandidate(jobB) - scoreImportedJobCandidate(jobA))[0];
	if (matchedJob) return matchedJob;

	const { data } = await http.get(url, {
		responseType: "text",
		headers: { Accept: "text/html,application/xhtml+xml" },
	});
	const $ = cheerio.load(data);
	const title =
		cleanText($('meta[property="og:title"]').attr("content")) ||
		cleanText($("h1").first().text()) ||
		cleanText($("title").first().text());
	const description =
		cleanText($('meta[property="og:description"]').attr("content")) ||
		cleanText($('meta[name="description"]').attr("content")) ||
		cleanText($("body").text()).slice(0, 2000);
	const parsed = parseTitleCompany(title);

	return {
		source: "Accepted Job Link",
		sourceId: normalizedUrl,
		title: parsed.title || "Imported job",
		company: parsed.company === "Unknown" ? inferCompanyFromHostname(url) : parsed.company,
		location: "Remote / See listing",
		url,
		description,
		datePosted: null,
		salaryRange: extractSalaryRange(`${title} ${description}`),
	};
}
