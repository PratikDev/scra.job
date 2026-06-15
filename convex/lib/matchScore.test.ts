import { describe, expect, it } from "vitest";
import { calculateMatchScore, tokenize } from "./matchScore";

describe("match scoring", () => {
	it("scores profile keyword overlap as a percentage", () => {
		expect(calculateMatchScore("React Node scraping", "Senior React developer building Node scrapers")).toBe(67);
	});

	it("drops short words and stop words", () => {
		expect(tokenize("the AI for React and C++")).toEqual(["react", "c++"]);
	});
});
