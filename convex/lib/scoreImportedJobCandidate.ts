import type { ScrapedJobPayload } from "./types";

export function scoreImportedJobCandidate(job: ScrapedJobPayload) {
	let score = 0;
	if (job.company && job.company !== "Unknown") score += 20;
	if (job.salaryRange) score += 5;
	if (job.description && job.description.length > 120) score += 5;
	if (job.source?.includes("Y Combinator")) score += 3;
	return score;
}
