import { describe, expect, it } from "vitest";
import { scoreImportedJobCandidate } from "./scoreImportedJobCandidate";
import type { ScrapedJobPayload } from "./types";

const baseJob: ScrapedJobPayload = {
	source: "Hacker News Jobs",
	sourceId: "1",
	title: "Engineer",
	company: "Unknown",
	location: "Remote",
	url: "https://news.ycombinator.com/item?id=1",
	description: "Engineer",
	datePosted: null,
	salaryRange: null,
};

describe("imported job candidate scoring", () => {
	it("prefers richer board metadata over sparse reposts", () => {
		const sparse = scoreImportedJobCandidate(baseJob);
		const rich = scoreImportedJobCandidate({
			...baseJob,
			source: "Y Combinator Software Engineer Jobs",
			company: "Circle Medical",
			description: "x".repeat(140),
			salaryRange: "$142K - $180K",
		});

		expect(rich).toBeGreaterThan(sparse);
	});
});
