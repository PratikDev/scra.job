import { describe, expect, it } from "vitest";
import { isRemoteLocation, onlyRemoteJobs } from "./remoteFilter";

describe("remote filtering", () => {
	it("accepts remote and work-from-anywhere locations", () => {
		expect(isRemoteLocation("Remote (US; CA)")).toBe(true);
		expect(isRemoteLocation("Work from anywhere")).toBe(true);
	});

	it("filters out non-remote jobs", () => {
		const jobs = onlyRemoteJobs([
			{ title: "A", location: "Remote" },
			{ title: "B", location: "New York, NY" },
		]);

		expect(jobs).toEqual([{ title: "A", location: "Remote" }]);
	});
});
