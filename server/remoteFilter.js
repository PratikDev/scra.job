export const REMOTE_LOCATION_PHRASES = [
	"remote",
	"work from anywhere",
	"work-from-anywhere",
	"100% remote",
	"fully remote",
	"anywhere",
	"worldwide",
	"global",
];

function cleanText(value = "") {
	return String(value).replace(/\s+/g, " ").trim();
}

export function isRemoteLocation(location = "") {
	const normalized = cleanText(location).toLowerCase();
	if (!normalized) return false;

	return REMOTE_LOCATION_PHRASES.some((phrase) => normalized.includes(phrase));
}

export function onlyRemoteJobs(jobs) {
	return jobs.filter((job) => isRemoteLocation(job.location));
}
